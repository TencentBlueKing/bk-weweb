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
import { BaseModel, IScriptOption } from '../typings';
import { addUrlProtocol, fillUpPath, isJsonpUrl, randomUrl } from '../utils/common';
import { fetchSource } from '../utils/fetch';
import { collectSource } from '../utils/load-source';
import { Script } from './script';
import { Style, excuteAppStyles } from './style';

const SCRIPT_TYPE_NAMES = [
  'text/javascript',
  'text/ecmascript',
  'application/javascript',
  'application/ecmascript',
  'module',
];
export class EntrySource {
  html: HTMLElement | null = null;
  rawHtml?: string;
  scripts: Map<string, Script>;
  styles: Map<string, Style>;
  constructor(public url: string) {
    this.scripts = new Map();
    this.styles = new Map();
  }
  collectLink(
    link: HTMLLinkElement,
    parent: Node,
    needReplaceELement = false,
  ): { replace: Comment | Element; style?: Style } {
    if (link.hasAttribute('exclude')) {
      return { replace: document.createComment('【bk-weweb】style with exclude attribute is ignored') };
    }
    if (link.hasAttribute('ignore')) {
      return { replace: link };
    }
    const rel = link.getAttribute('rel');
    let href = link.getAttribute('href');
    let replaceElement;
    if (rel === 'stylesheet' && href) {
      href = fillUpPath(href, this.url);
      replaceElement = document.createComment(`【bk-weweb】style with href=${href}`);
      let styleInstance = this.getStyle(href);
      if (!styleInstance) {
        styleInstance = new Style({
          code: '',
          fromHtml: !needReplaceELement,
          prefetch: !!link.getAttribute('prefetch'),
          preload: !!link.getAttribute('preload'),
          url: href,
        });
        this.styles.set(href, styleInstance);
      }
      !needReplaceELement && parent.replaceChild(replaceElement, link);
      return { replace: replaceElement, style: styleInstance };
    }
    if (rel && ['apple-touch-icon', 'icon', 'prefetch', 'preload', 'prerender'].includes(rel)) {
      // preload prefetch icon ....
      replaceElement = document.createComment(`【bk-weweb】style with rel=${rel}${href ? ` & href=${href}` : ''}`);
      !needReplaceELement && parent.removeChild(link);
      return { replace: replaceElement };
    }
    if (href) {
      // dns-prefetch preconnect modulepreload search ....
      link.setAttribute('href', fillUpPath(href, this.url));
    }
    return { replace: link };
  }
  collectScript(
    script: HTMLScriptElement,
    parent: Node,
    needReplaceELement = false,
  ): { replace: Comment | Element; script?: Script } | undefined {
    if (
      script.hasAttribute('ignore') ||
      isJsonpUrl(script.getAttribute('src')) ||
      (script.hasAttribute('type') && !SCRIPT_TYPE_NAMES.includes(script.type))
    ) {
      return;
    }
    let replaceElement: Comment | null = null;
    if (script.hasAttribute('exclude')) {
      replaceElement = document.createComment('【bk-weweb】script element with exclude attribute is removed');
      !needReplaceELement && parent.replaceChild(replaceElement!, script);
      return { replace: replaceElement! };
    }
    let src: null | string = script.getAttribute('src');
    if (src) {
      src = fillUpPath(src, this.url);
      let scriptInstance = this.getScript(src);
      if (!scriptInstance) {
        scriptInstance = new Script({
          async: script.hasAttribute('async'),
          code: '',
          defer: script.defer || script.type === 'module',
          fromHtml: !needReplaceELement,
          isModule: script.type === 'module',
          url: src,
        });
        this.scripts.set(src, scriptInstance);
      }
      replaceElement = document.createComment(`【bk-weweb】script with src='${src}'`);
      !needReplaceELement && parent.replaceChild(replaceElement, script);
      return { replace: replaceElement, script: scriptInstance };
    }
    if (script.textContent) {
      const nonceStr: string = randomUrl();
      const scriptInstance = new Script({
        async: false,
        // code: script.textContent.replace(/var\s+(\w+)=/gm, `window.$1 = `),
        code: script.textContent,
        defer: script.type === 'module',
        fromHtml: !needReplaceELement,
        initial: true,
        isModule: script.type === 'module',
        url: nonceStr!,
      });
      this.scripts.set(nonceStr, scriptInstance);
      replaceElement = document.createComment('【bk-weweb】script with texcontent');
      !needReplaceELement && parent.replaceChild(replaceElement, script);
      return {
        replace: replaceElement,
        script: scriptInstance,
      };
    }
    return { replace: script };
  }
  collectScriptAndStyle(parent: HTMLElement): void {
    const links = Array.from(parent.querySelectorAll('link'));
    links?.forEach(link => {
      this.collectLink(link, link.parentElement!);
    });
    const styles = Array.from(parent.querySelectorAll('style'));
    styles?.forEach(style => {
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
    });
    const scripts = Array.from(parent.querySelectorAll('script'));
    scripts?.forEach(script => {
      this.collectScript(script, script.parentElement!);
    });
    const metas = Array.from(parent.querySelectorAll('meta'));
    metas?.forEach(meta => {
      meta.parentElement!.removeChild(meta);
    });
    const imgs = Array.from(parent.querySelectorAll('img'));
    imgs?.forEach(img => {
      if (img.hasAttribute('src')) {
        img.setAttribute('src', fillUpPath(img.getAttribute('src')!, this.url));
      }
    });
    // const children = Array.from(parent.children);
    // children?.forEach(dom => {
    //   if (dom instanceof HTMLLinkElement) {
    //     this.collectLink(dom, parent);
    //   } else if (dom instanceof HTMLStyleElement) {
    //     if (!dom.hasAttribute('exclude') && !dom.hasAttribute('ignore')) {
    //       this.styles.set(
    //         randomUrl(),
    //         new Style({
    //           code: dom.textContent || '',
    //           fromHtml: true,
    //           url: '',
    //         }),
    //       );
    //       dom.remove();
    //     }
    //   } else if (dom instanceof HTMLScriptElement) {
    //     this.collectScript(dom, parent);
    //   } else if (dom instanceof HTMLMetaElement || dom instanceof HTMLTitleElement) {
    //     parent.removeChild(dom);
    //   } else if (dom instanceof HTMLImageElement && dom.hasAttribute('src')) {
    //     dom.setAttribute('src', fillUpPath(dom.getAttribute('src')!, this.url));
    //   }
    // });
    // children.length &&
    //   children.forEach(child => {
    //     this.collectScriptAndStyle(child as HTMLElement, app);
    //   });
  }
  getScript(url: string) {
    return this.scripts.get(url);
  }
  getStyle(urlOrCode: string) {
    return this.styles.get(urlOrCode) || Array.from(this.styles.values()).find(style => style.code === urlOrCode);
  }
  async importEntery(app: BaseModel): Promise<void> {
    if (app.initSource?.length) {
      // 初始化配置的公共source资源
      const { collectScript, collectStyle } = await collectSource(app.initSource);
      if (collectScript) {
        this.scripts = collectScript;
      }
      if (collectStyle) {
        this.styles = collectStyle;
      }
    }
    if (app instanceof MicroAppModel) await this.importHtmlEntry(app);
    else if (app instanceof MicroInstanceModel) await this.importInstanceEntry();
  }
  async importHtmlEntry(app: MicroAppModel): Promise<void> {
    let htmlStr = appCache.getCacheHtml(this.url);
    if (!htmlStr) {
      htmlStr = await fetchSource(addUrlProtocol(this.url), { cache: 'no-cache' });
      if (!htmlStr) {
        console.error('load app entry error, pleace check');
        return Promise.reject();
      }
    }
    this.rawHtml = htmlStr;
    const wrapElement = document.createElement('div');
    if (wrapElement.__BK_WEWEB_APP_KEY__) delete wrapElement.__BK_WEWEB_APP_KEY__;
    wrapElement.innerHTML = htmlStr.replace(/<\/?head>/gim, '').replace(/<\/?body>/i, '');
    this.collectScriptAndStyle(wrapElement);
    await excuteAppStyles(app, wrapElement);
    this.html = wrapElement;
  }
  async importInstanceEntry(): Promise<void> {
    let jsStr = appCache.getCacheScript(this.url)?.code;
    if (!jsStr) {
      jsStr = await fetchSource(this.url, { cache: 'no-cache' });
    }
    if (!jsStr) {
      console.error('load app entry error, pleace check');
      return Promise.reject();
    }
    this.scripts.set(
      this.url,
      new Script({
        async: false,
        code: jsStr,
        defer: false,
        fromHtml: true,
        isModule: !!this.url.match(/\.ts$/),
        url: this.url,
      }),
    );
  }
  setScript(url: string, script: IScriptOption | Script) {
    this.scripts.set(url, script instanceof Script ? script : new Script(script));
  }
  setStyle(url: string, style: Style) {
    this.styles.set(url, style);
  }
}
