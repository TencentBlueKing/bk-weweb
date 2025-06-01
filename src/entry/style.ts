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
// import { disabledStyleDom } from '../context/cache';
import { type BaseModel, CssRuleEnum, type IStyleOption } from '../typings';
import { setMarkElement } from '../utils';
import { addUrlProtocol, fillUpPath } from '../utils/common';
import { dispatchLinkOrScriptError, dispatchLinkOrScriptLoad } from '../utils/custom';
import { fetchSource } from '../utils/fetch';

const CSS_SELECTORS = {
  ROOT_SELECTOR: /^((html[\s>~,]+body)|(html|body|:root))$/,
  BUILT_IN_ROOT_SELECTOR: /(^|\s+)((html[\s>~]+body)|(html|body|:root))(?=[\s>~]+|$)/,
  FONT_FACE: /@font-face\s*\{[^}]+\}/g,
  URL_PATTERN: /url\(["']?([^)"']+)["']?\)/gm,
  DATA_BLOB_PROTOCOL: /^(data|blob):/,
  HTTP_PROTOCOL: /^(https?:)?\/\//,
  RELATIVE_PATH: /^((\.\.?\/)|[^/])/,
  ROOT_HOST_PATTERN: /(:?:root|html)/gm,
} as const;

const STYLE_ATTRIBUTES = {
  TYPE: 'text/css',
  POWERED_BY: 'bk-weweb',
  LINKED_FROM_BASE: 'linked-from-base',
  ORIGIN_SRC: 'origin-src',
} as const;

const PACK_RULE_NAMES = {
  MEDIA: 'media',
  SUPPORTS: 'supports',
} as const;

type PackRuleType = CSSMediaRule | CSSSupportsRule;
type MutationObserverConfig = MutationObserverInit;

/**
 * 样式处理类
 */
export class Style {
  code = '';
  fromHtml: boolean;
  initial: boolean;
  prefetch = false;
  preload = false;
  scoped: boolean;
  scopedCode = '';
  url: string | undefined;

  constructor({ code, fromHtml, initial, prefetch, preload, url }: IStyleOption) {
    this.scoped = false;
    this.code = code;
    this.prefetch = prefetch ?? false;
    this.preload = preload ?? false;
    this.url = url;
    this.fromHtml = fromHtml;
    this.initial = initial ?? false;
  }

  /**
   * 通用样式作用域处理
   * @param styleElement 样式元素
   * @param app 应用实例
   */
  commonScoped(styleElement: HTMLStyleElement, app: BaseModel): void {
    if (app.scopeCss && !(app.container instanceof ShadowRoot)) {
      this.applyScopedCSS(styleElement, app);
    } else {
      this.applyUnscopedCSS(styleElement, app);
    }
    this.scoped = true;
  }

  /**
   * 创建样式元素
   */
  createStyleElement(): HTMLStyleElement {
    const styleElement = document.createElement('style');
    if (styleElement.__BK_WEWEB_APP_KEY__) {
      styleElement.__BK_WEWEB_APP_KEY__ = undefined;
    }
    return styleElement;
  }

  /**
   * 执行样式代码
   * @param app 应用实例
   * @returns 返回执行后的style标签
   */
  async executeCode(app: BaseModel): Promise<HTMLStyleElement> {
    app.registerRunningApp();
    let styleElement = this.createStyleElement();
    styleElement.setAttribute('type', STYLE_ATTRIBUTES.TYPE);
    styleElement.textContent = this.code;

    try {
      if (!this.code) {
        await this.getCode(app);
      }
      styleElement = this.scopedStyleCSS(app, styleElement);
      this.scoped = true;
    } catch (error) {
      console.error('scoped style error', error);
    }

    return styleElement;
  }

  /**
   * 获取样式代码
   */
  async getCode(app?: BaseModel): Promise<string> {
    if (this.code.length || !this.url) {
      return this.code;
    }

    const code = this.getCodeFromAppSource(app) || this.getCodeFromCache() || (await this.fetchCodeFromRemote(app));

    this.code = code;
    return code;
  }

  /**
   * 检查并链接基础应用样式
   * @param styleElement 样式元素
   * @param app 应用实例
   * @returns 是否已链接基础样式
   */
  linkedBaseStyle(styleElement: HTMLStyleElement, app: BaseModel): boolean {
    if (
      !(app.container instanceof ShadowRoot) &&
      styleElement.textContent &&
      appCache.getBaseAppStyle(styleElement.textContent)
    ) {
      this.clearStyleElement(styleElement);
      styleElement.setAttribute(STYLE_ATTRIBUTES.LINKED_FROM_BASE, 'true');
      return true;
    }
    return false;
  }

  /**
   * 重置包装规则
   */
  resetPackRule(rule: PackRuleType, prefix: string, packName: string): string {
    const result = this.scopeRule(Array.from(rule.cssRules), prefix);
    return `@${packName} ${rule.conditionText} {${result}}`;
  }

  /**
   * 重置URL地址
   */
  resetUrlHost(cssText: string, uri: string, linkPath?: string): string {
    let baseURI = uri;
    return cssText.replace(CSS_SELECTORS.URL_PATTERN, (text, matchedUrl) => {
      if (CSS_SELECTORS.DATA_BLOB_PROTOCOL.test(matchedUrl) || CSS_SELECTORS.HTTP_PROTOCOL.test(matchedUrl)) {
        return text;
      }

      if (CSS_SELECTORS.RELATIVE_PATH.test(matchedUrl) && linkPath) {
        baseURI = this.buildBaseURI(linkPath);
      }

      return `url("${fillUpPath(matchedUrl, baseURI)}")`;
    });
  }

  /**
   * css rule 处理
   */
  scopeRule(rules: CSSRule[], cssPrefix: string): string {
    let result = '';

    for (const rule of rules) {
      switch (rule.type) {
        case CssRuleEnum.STYLE_RULE:
          result += this.scopeStyleRule(rule as CSSStyleRule, cssPrefix);
          break;
        case CssRuleEnum.MEDIA_RULE:
          result += this.resetPackRule(rule as CSSMediaRule, cssPrefix, PACK_RULE_NAMES.MEDIA);
          break;
        case CssRuleEnum.SUPPORTS_RULE:
          result += this.resetPackRule(rule as CSSSupportsRule, cssPrefix, PACK_RULE_NAMES.SUPPORTS);
          break;
        default:
          result += rule.cssText;
          break;
      }
    }

    return result.replace(/^\s+/, '');
  }

  /**
   * style rule 处理
   */
  scopeStyleRule(rule: CSSStyleRule, prefix: string): string {
    const { cssText, selectorText } = rule;

    if (CSS_SELECTORS.ROOT_SELECTOR.test(selectorText)) {
      return cssText.replace(CSS_SELECTORS.ROOT_SELECTOR, prefix);
    }

    if (selectorText === '*') {
      return cssText.replace('*', `${prefix} *`);
    }

    return cssText.replace(/^[\s\S]+{/, selectors =>
      selectors.replace(/(^|,)([^,]+)/g, (all, delimiter, selector) => {
        if (CSS_SELECTORS.BUILT_IN_ROOT_SELECTOR.test(selector)) {
          return all.replace(CSS_SELECTORS.BUILT_IN_ROOT_SELECTOR, prefix);
        }
        return `${delimiter} ${prefix} ${selector.replace(/^\s*/, '')}`;
      }),
    );
  }

  /**
   * link style 处理
   */
  scopedLinkCSS(app: BaseModel, linkElement: HTMLLinkElement): HTMLStyleElement {
    const styleElement = this.createStyleElement();
    styleElement.setAttribute('type', STYLE_ATTRIBUTES.TYPE);

    const needKeepAlive = !!app.keepAlive && !(app.container instanceof ShadowRoot);
    setMarkElement(styleElement, app, needKeepAlive);
    const container = needKeepAlive ? document.head : app.container;

    try {
      if (this.code) {
        this.handleExistingCode(styleElement, app, container, linkElement);
      } else if (linkElement.getAttribute('href')) {
        this.handleHrefAttribute(styleElement, app, container, linkElement);
      } else {
        this.handleMissingHref(styleElement, app, container, linkElement);
      }
    } catch {
      linkElement && dispatchLinkOrScriptError(linkElement);
    }

    return styleElement;
  }

  /**
   * 隔离 style
   */
  scopedStyleCSS(app: BaseModel, styleElement: HTMLStyleElement): HTMLStyleElement {
    const needKeepAlive = !!app.keepAlive && !(app.container instanceof ShadowRoot);
    setMarkElement(styleElement, app, needKeepAlive);

    if (this.code || styleElement.textContent) {
      this.processExistingContent(styleElement, app);
    } else {
      this.observeContentChanges(styleElement, app);
    }

    if (this.url) {
      styleElement.setAttribute(STYLE_ATTRIBUTES.ORIGIN_SRC, this.url);
    }

    return styleElement;
  }

  /**
   * 应用隔离 style
   */
  private applyScopedCSS(styleElement: HTMLStyleElement, app: BaseModel): void {
    const cssStyleSheet = new CSSStyleSheet({ disabled: true });
    cssStyleSheet.replaceSync(styleElement.textContent || this.code);
    const rules: CSSRule[] = Array.from(cssStyleSheet?.cssRules ?? []);
    const cssPrefix = `#${app.name}`;
    const scopedCss = this.scopeRule(rules, cssPrefix);
    const cssText = this.resetUrlHost(scopedCss, app.url, this.url);
    styleElement.textContent = cssText;
    this.scopedCode = cssText;
  }

  private applyUnscopedCSS(styleElement: HTMLStyleElement, app: BaseModel): void {
    const cssText = this.resetUrlHost(styleElement.textContent || this.code || '', app.url, this.url);

    // fix https://bugs.chromium.org/p/chromium/issues/detail?id=336876
    if (cssText && app.container instanceof ShadowRoot) {
      this.handleShadowRootFonts(cssText, app);
    }

    styleElement.textContent = cssText.replace(CSS_SELECTORS.ROOT_HOST_PATTERN, ':host');
  }

  /**
   * 处理ShadowRoot中的字体
   */
  private handleShadowRootFonts(cssText: string, app: BaseModel): void {
    let fontContent = '';
    const fontFaces = cssText.match(CSS_SELECTORS.FONT_FACE) || [];

    for (const fontFace of fontFaces) {
      fontContent += `${fontFace}\n`;
    }

    const rawDocument = app.sandBox?.rawDocument;
    if (rawDocument && fontContent) {
      const fontStyle = rawDocument.createElement('style');
      fontStyle.setAttribute('type', STYLE_ATTRIBUTES.TYPE);
      fontStyle.setAttribute('powered-by', STYLE_ATTRIBUTES.POWERED_BY);
      fontStyle.textContent = fontContent;
      rawDocument?.head?.append(fontStyle);
    }
  }

  private getCodeFromAppSource(app?: BaseModel): string {
    if (this.url && app?.source?.styles?.has(this.url)) {
      return app.source.styles.get(this.url)?.code || '';
    }
    return '';
  }
  private getCodeFromCache(): string {
    if (this.url && appCache.getCacheStyle(this.url)) {
      const style = appCache.getCacheStyle(this.url);
      return style?.code || '';
    }
    return '';
  }
  private async fetchCodeFromRemote(app?: BaseModel): Promise<string> {
    return await fetchSource(this.url!, {}, app).catch(() => '');
  }
  private clearStyleElement(styleElement: HTMLStyleElement): void {
    styleElement.textContent = '';
    styleElement.innerHTML = '';
  }
  private buildBaseURI(linkPath: string): string {
    const pathArr = linkPath.split('/');
    pathArr.pop();
    return addUrlProtocol(`${pathArr.join('/')}/`);
  }
  private handleExistingCode(
    styleElement: HTMLStyleElement,
    app: BaseModel,
    container: Element | ShadowRoot | null | undefined,
    linkElement: HTMLLinkElement,
  ): void {
    this.commonScoped(styleElement, app);
    container?.prepend(styleElement);
    linkElement && dispatchLinkOrScriptLoad(linkElement);
  }

  /**
   * 处理href属性
   */
  private handleHrefAttribute(
    styleElement: HTMLStyleElement,
    app: BaseModel,
    container: Element | ShadowRoot | null | undefined,
    linkElement: HTMLLinkElement,
  ): void {
    this.url = fillUpPath(linkElement.getAttribute('href')!, app.url);
    this.getCode(app).then(() => {
      this.scopedStyleCSS(app, styleElement);
      linkElement.remove();
      container?.prepend(styleElement);
      linkElement && dispatchLinkOrScriptLoad(linkElement);
      this.scoped = true;
    });
  }

  /**
   * 处理缺失的href
   */
  private handleMissingHref(
    styleElement: HTMLStyleElement,
    app: BaseModel,
    container: Element | ShadowRoot | null | undefined,
    linkElement: HTMLLinkElement,
  ): void {
    const observer = new MutationObserver(() => {
      const href = linkElement.getAttribute('href');
      if (!href) return;
      observer.disconnect();
      this.url = fillUpPath(href, app.url);
      this.getCode(app).then(() => {
        this.scopedStyleCSS(app, styleElement);
        linkElement.remove();
        container?.prepend(styleElement);
        linkElement && dispatchLinkOrScriptLoad(linkElement);
        this.scoped = true;
      });
    });

    const observerConfig: MutationObserverConfig = {
      attributeFilter: ['href'],
      childList: false,
      subtree: false,
    };

    observer.observe(linkElement, observerConfig);
  }

  private processExistingContent(styleElement: HTMLStyleElement, app: BaseModel): void {
    if (styleElement.textContent) {
      this.clearStyleElement(styleElement);
    }
    if (!this.linkedBaseStyle(styleElement, app)) {
      this.commonScoped(styleElement, app);
    }
  }
  private observeContentChanges(styleElement: HTMLStyleElement, app: BaseModel): void {
    const observer = new MutationObserver(() => {
      if (!(styleElement.textContent || styleElement.sheet?.cssRules?.length)) return;
      observer.disconnect();
      if (!this.linkedBaseStyle(styleElement, app)) {
        this.commonScoped(styleElement, app);
      }
    });

    const observerConfig: MutationObserverConfig = {
      attributes: false,
      characterData: true,
      childList: true,
      subtree: true,
    };

    observer.observe(styleElement, observerConfig);
  }
}

/**
 * 执行应用样式
 */
export async function executeAppStyles(app: BaseModel, container?: Element | ShadowRoot): Promise<void> {
  const styleList: Style[] = Array.from(app.source?.styles?.values() || []);
  const promiseList: Promise<HTMLStyleElement>[] = [];

  for (const style of styleList) {
    promiseList.push(style.executeCode(app));
  }

  await Promise.all(promiseList).then((styleElementList: HTMLStyleElement[]) => {
    const parentElement = container || app.container;
    if (app.keepAlive && !(parentElement instanceof ShadowRoot)) {
      document.head.append(...styleElementList);
    } else {
      parentElement?.append(...styleElementList);
    }
  });
}
