/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { appCache } from '../cache/app-cache';
import { MicroAppModel } from '../mode/app';
import { MicroInstanceModel } from '../mode/instance';
import { addUrlProtocol, fillUpPath, randomUrl } from '../utils/common';
import { fetchSource } from '../utils/fetch';
import { collectSource } from '../utils/load-source';
import { Script } from './script';
import { Style, executeAppStyles } from './style';

import type { BaseModel, IScriptOption } from '../typings';

const SCRIPT_TYPE_NAMES = [
  'text/javascript',
  'text/ecmascript',
  'application/javascript',
  'application/ecmascript',
  'module',
] as const;

const ICON_REL_TYPES = ['apple-touch-icon', 'icon', 'prefetch', 'preload', 'prerender'] as const;

type IconRelType = (typeof ICON_REL_TYPES)[number];
type ScriptTypeName = (typeof SCRIPT_TYPE_NAMES)[number];

const HTML_FILTER_REGEX = {
  HEAD: /<\/?head>/gim,
  BODY: /<\/?body>/i,
  TS_EXTENSION: /\.ts$/,
} as const;

// 收集结果
interface CollectResult {
  replace: Comment | Element; // 替换元素
  style?: Style; // 样式
  script?: Script; // 脚本
}

export class EntrySource {
  html: HTMLElement | null = null;
  rawHtml?: string;
  scripts: Map<string, Script>;
  styles: Map<string, Style>;

  constructor(public url: string) {
    this.scripts = new Map();
    this.styles = new Map();
  }

  /** 收集链接元素 */
  collectLink = (
    link: HTMLLinkElement,
    parent: Node,
    needReplaceElement = false,
  ): { replace: Comment | Element; style?: Style } => {
    if (link.hasAttribute('exclude')) {
      return {
        replace: document.createComment('【bk-weweb】style with exclude attribute is ignored'),
      };
    }

    if (link.hasAttribute('ignore')) {
      return { replace: link };
    }

    const rel = link.getAttribute('rel');
    const href = link.getAttribute('href');

    if (rel === 'stylesheet' && href) {
      return this.handleStylesheetLink(link, parent, href, needReplaceElement);
    }

    if (rel && ICON_REL_TYPES.includes(rel as IconRelType)) {
      return this.handleIconLink(link, parent, rel, href, needReplaceElement);
    }

    if (href) {
      link.setAttribute('href', fillUpPath(href, this.url));
    }

    return { replace: link };
  };

  /** 收集脚本元素 */
  collectScript = (script: HTMLScriptElement, parent: Node, needReplaceElement = false): CollectResult | undefined => {
    if (this.shouldIgnoreScript(script)) {
      return;
    }

    if (script.hasAttribute('exclude')) {
      return this.handleExcludedScript(script, parent, needReplaceElement);
    }

    const src = script.getAttribute('src');
    if (src) {
      return this.handleExternalScript(script, parent, src, needReplaceElement);
    }

    if (script.textContent) {
      return this.handleInlineScript(script, parent, needReplaceElement);
    }

    return { replace: script };
  };

  /** 收集样式和脚本 */
  collectScriptAndStyle = (parent: HTMLElement): void => {
    this.processLinks(parent);
    this.processStyles(parent);
    this.processScripts(parent);
    this.processMetas(parent);
    this.processImages(parent);
  };

  getScript = (url: string): Script | undefined => this.scripts.get(url);

  getStyle = (urlOrCode: string): Style | undefined => {
    return this.styles.get(urlOrCode) || Array.from(this.styles.values()).find(style => style.code === urlOrCode);
  };

  /** html entry */
  async importEntry(app: BaseModel): Promise<void> {
    await this.loadInitialSources(app);

    if (app instanceof MicroAppModel) {
      await this.importHtmlEntry(app);
    } else if (app instanceof MicroInstanceModel) {
      await this.importInstanceEntry(app);
    }
  }

  /** 微应用入口 */
  async importHtmlEntry(app: MicroAppModel): Promise<void> {
    const htmlStr = await this.fetchHtmlContent(app);
    if (!htmlStr) {
      console.error('load app entry error, place check');
      return Promise.reject();
    }

    this.rawHtml = htmlStr;
    const wrapElement = this.createWrapElement(htmlStr);

    this.collectScriptAndStyle(wrapElement);
    await executeAppStyles(app, wrapElement);

    this.html = wrapElement;
  }

  /** 微模块入口 */
  async importInstanceEntry(app: BaseModel): Promise<void> {
    const jsStr = await this.fetchJsContent(app);
    if (!jsStr) {
      console.error('load app entry error, place check');
      return Promise.reject();
    }

    this.scripts.set(
      this.url,
      new Script({
        async: false,
        code: jsStr,
        defer: false,
        fromHtml: true,
        isModule: HTML_FILTER_REGEX.TS_EXTENSION.test(this.url),
        url: this.url,
      }),
    );
  }

  setScript = (url: string, script: IScriptOption | Script): void => {
    this.scripts.set(url, script instanceof Script ? script : new Script(script));
  };

  setStyle = (url: string, style: Style): void => {
    this.styles.set(url, style);
  };

  /** 处理样式表链接 */
  private handleStylesheetLink = (link: HTMLLinkElement, parent: Node, href: string, needReplaceElement: boolean) => {
    const fullHref = fillUpPath(href, this.url);
    const replaceElement = document.createComment(`【bk-weweb】style with href=${fullHref}`);

    let styleInstance = this.getStyle(fullHref);
    if (!styleInstance) {
      styleInstance = new Style({
        code: '',
        fromHtml: !needReplaceElement,
        prefetch: !!link.getAttribute('prefetch'),
        preload: !!link.getAttribute('preload'),
        url: fullHref,
      });
      this.styles.set(fullHref, styleInstance);
    }

    if (!needReplaceElement) {
      parent.replaceChild(replaceElement, link);
    }

    return { replace: replaceElement, style: styleInstance };
  };

  /**
   * 处理图标链接
   */
  private handleIconLink = (
    link: HTMLLinkElement,
    parent: Node,
    rel: string,
    href: null | string,
    needReplaceElement: boolean,
  ) => {
    const replaceElement = document.createComment(`【bk-weweb】style with rel=${rel}${href ? ` & href=${href}` : ''}`);

    if (!needReplaceElement) {
      parent.removeChild(link);
    }

    return { replace: replaceElement };
  };

  /**
   * 检查是否应该忽略脚本
   */
  private shouldIgnoreScript = (script: HTMLScriptElement): boolean => {
    return (
      script.hasAttribute('ignore') ||
      // (script.type !== 'module' && isJsonpUrl(script.getAttribute('src'))) ||
      (script.hasAttribute('type') && !SCRIPT_TYPE_NAMES.includes(script.type as ScriptTypeName))
    );
  };

  /**
   * 处理被排除的脚本
   */
  private handleExcludedScript = (
    script: HTMLScriptElement,
    parent: Node,
    needReplaceElement: boolean,
  ): CollectResult => {
    const replaceElement = document.createComment('【bk-weweb】script element with exclude attribute is removed');

    if (!needReplaceElement) {
      parent.replaceChild(replaceElement, script);
    }

    return { replace: replaceElement };
  };

  /**
   * 处理外部脚本
   */
  private handleExternalScript = (
    script: HTMLScriptElement,
    parent: Node,
    src: string,
    needReplaceElement: boolean,
  ): CollectResult => {
    const fullSrc = fillUpPath(src, this.url);

    let scriptInstance = this.getScript(fullSrc);
    if (!scriptInstance) {
      scriptInstance = new Script({
        async: script.hasAttribute('async'),
        code: '',
        defer: script.defer || script.type === 'module',
        fromHtml: !needReplaceElement,
        isModule: script.type === 'module',
        url: fullSrc,
      });
      this.scripts.set(fullSrc, scriptInstance);
    }

    const replaceElement = document.createComment(`【bk-weweb】script with src='${fullSrc}'`);

    if (!needReplaceElement) {
      parent.replaceChild(replaceElement, script);
    }

    return { replace: replaceElement, script: scriptInstance };
  };

  /**
   * 处理内联脚本
   */
  private handleInlineScript = (
    script: HTMLScriptElement,
    parent: Node,
    needReplaceElement: boolean,
  ): CollectResult => {
    const nonceStr = randomUrl();
    const scriptInstance = new Script({
      async: false,
      code: script.textContent || '',
      defer: script.type === 'module',
      fromHtml: !needReplaceElement,
      initial: false,
      isModule: script.type === 'module',
      url: nonceStr,
    });

    this.scripts.set(nonceStr, scriptInstance);
    const replaceElement = document.createComment('【bk-weweb】script with text content');

    if (!needReplaceElement) {
      parent.replaceChild(replaceElement, script);
    }

    return { replace: replaceElement, script: scriptInstance };
  };

  /**
   * 处理链接元素
   */
  private processLinks = (parent: HTMLElement): void => {
    const links = Array.from(parent.querySelectorAll('link'));
    for (const link of links) {
      link.parentElement && this.collectLink(link, link.parentElement);
    }
  };

  /**
   * 处理样式元素
   */
  private processStyles = (parent: HTMLElement): void => {
    const styles = Array.from(parent.querySelectorAll('style'));
    for (const style of styles) {
      if (!style.hasAttribute('exclude') && !style.hasAttribute('ignore')) {
        this.styles.set(
          randomUrl(),
          new Style({
            code: style.textContent || '',
            fromHtml: true,
            url: '',
          }),
        );
        style.remove();
      }
    }
  };

  /**
   * 处理脚本元素
   */
  private processScripts = (parent: HTMLElement): void => {
    const scripts = Array.from(parent.querySelectorAll('script'));
    for (const script of scripts) {
      script.parentElement && this.collectScript(script, script.parentElement);
    }
  };

  /**
   * 处理Meta元素
   */
  private processMetas = (parent: HTMLElement): void => {
    const metas = Array.from(parent.querySelectorAll('meta'));
    for (const meta of metas) {
      meta.parentElement?.removeChild(meta);
    }
  };

  /**
   * 处理图片元素
   */
  private processImages = (parent: HTMLElement): void => {
    const imgs = Array.from(parent.querySelectorAll('img'));
    for (const img of imgs) {
      if (img.hasAttribute('src')) {
        img.setAttribute('src', fillUpPath(img.getAttribute('src') || '', this.url));
      }
    }
  };

  /**
   * 加载初始资源
   */
  private async loadInitialSources(app: BaseModel): Promise<void> {
    if (!app.initSource?.length) return;

    const { collectScript, collectStyle } = await collectSource(app.initSource);

    if (collectScript) {
      this.scripts = collectScript;
    }
    if (collectStyle) {
      this.styles = collectStyle;
    }
  }

  /**
   * 获取HTML content
   */
  private async fetchHtmlContent(app: MicroAppModel): Promise<string> {
    let htmlStr = appCache.getCacheHtml(this.url);

    if (!htmlStr) {
      htmlStr = await fetchSource(addUrlProtocol(this.url), { cache: 'no-cache' }, app);
    }

    return htmlStr;
  }

  /**
   * 创建顶层 root 元素
   */
  private createWrapElement(htmlStr: string): HTMLDivElement {
    const wrapElement = document.createElement('div');

    if (wrapElement.__BK_WEWEB_APP_KEY__) {
      wrapElement.__BK_WEWEB_APP_KEY__ = undefined;
    }

    wrapElement.innerHTML = htmlStr.replace(HTML_FILTER_REGEX.HEAD, '').replace(HTML_FILTER_REGEX.BODY, '');

    return wrapElement;
  }

  /**
   * 获取JS content
   */
  private async fetchJsContent(app: BaseModel): Promise<string> {
    let jsStr = appCache.getCacheScript(this.url)?.code;

    if (!jsStr) {
      jsStr = await fetchSource(this.url, { cache: 'no-cache' }, app);
    }

    return jsStr;
  }
}
