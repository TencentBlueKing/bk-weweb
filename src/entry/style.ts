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
import { BaseModel, CssRuleEnum, IStyleOption } from '../typings';
import { setMarkElement } from '../utils';
import { addUrlProtocol, fillUpPath } from '../utils/common';
import { dispatchLinkOrScriptError, dispatchLinkOrScriptLoad } from '../utils/custom';
import { fetchSource } from '../utils/fetch';

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
   * @param styleElement 样式node
   * @param app 应用实例
   */
  commonScoped(styleElement: HTMLStyleElement, app: BaseModel) {
    if (app.scopeCss && !(app.container instanceof ShadowRoot)) {
      const cssStyleSheet = new CSSStyleSheet({ disabled: true });
      (cssStyleSheet as any).replaceSync(styleElement.textContent || this.code);
      const rules: CSSRule[] = Array.from(cssStyleSheet?.cssRules ?? []);
      const cssPrefix = `#${app.name}`;
      const scopedCss = this.scopeRule(rules, cssPrefix);
      const cssText = this.resetUrlHost(scopedCss, app.url, this.url);
      styleElement.textContent = cssText;
      this.scopedCode = cssText;
    } else {
      const cssText = this.resetUrlHost(styleElement.textContent || this.code || '', app.url, this.url);
      // fix https://bugs.chromium.org/p/chromium/issues/detail?id=336876
      if (cssText && app.container instanceof ShadowRoot) {
        let fontContent = '';
        cssText.match(/@font-face\s*\{[^}]+\}/g)?.forEach(fontFace => {
          fontContent += `${fontFace}\n`;
        });
        const rawDocument = app.sandBox?.rawDocument;
        if (rawDocument && fontContent) {
          const fontStyle = rawDocument.createElement('style');
          fontStyle.setAttribute('type', 'text/css');
          fontStyle.setAttribute('powered-by', 'bk-weweb');
          fontStyle.textContent = fontContent;
          rawDocument?.head?.append(fontStyle);
        }
      }
      styleElement.textContent = cssText;
    }
    this.scoped = true;
  }
  createStyleElement() {
    const styleElement = document.createElement('style');
    if (styleElement.__BK_WEWEB_APP_KEY__) delete styleElement.__BK_WEWEB_APP_KEY__;
    return styleElement;
  }
  /**
   * @param app 应用实例
   * @returns 返回执行后的style标签
   */
  async excuteCode(app: BaseModel): Promise<HTMLStyleElement> {
    app.registerRunningApp();
    let styleElement = this.createStyleElement();
    styleElement.setAttribute('type', 'text/css');
    styleElement.textContent = this.code!;
    try {
      if (!this.code) await this.getCode(app);
      styleElement = this.scopedStyleCSS(app, styleElement);
      this.scoped = true;
    } catch (e) {
      console.error('scoped style error', e);
    }
    return styleElement;
  }
  async getCode(app?: BaseModel): Promise<string> {
    if (this.code.length || !this.url) {
      return this.code;
    }
    let code = '';
    if (app?.source?.styles?.has(this.url)) {
      code = app.source.styles.get(this.url)?.code || '';
    }
    if (!code && appCache.getCacheStyle(this.url)) {
      const style = appCache.getCacheStyle(this.url);
      code = style?.code || '';
    }
    if (!code) {
      code = await fetchSource(this.url).catch(() => '');
    }
    this.code = code;
    return code;
  }
  // 主应用已生效的样式 不再应用在子应用
  linkedBaseStyle(styleElement: HTMLStyleElement, app: BaseModel) {
    if (
      !(app.container instanceof ShadowRoot) &&
      styleElement.textContent &&
      appCache.getBaseAppStyle(styleElement.textContent)
    ) {
      styleElement.textContent = '';
      styleElement.innerHTML = '';
      styleElement.setAttribute('linked-from-base', 'true');
      return true;
    }
    return false;
  }
  resetPackRule(rule: CSSMediaRule | CSSSupportsRule, prefix: string, packName: string): string {
    const result = this.scopeRule(Array.from(rule.cssRules), prefix);
    return `@${packName} ${rule.conditionText} {${result}}`;
  }
  resetUrlHost(cssText: string, baseURI: string, linkpath?: string) {
    return cssText.replace(/url\(["']?([^)"']+)["']?\)/gm, (text, $1) => {
      if (/^(data|blob):/.test($1) || /^(https?:)?\/\//.test($1)) {
        return text;
      }
      if (/^((\.\.?\/)|[^/])/.test($1) && linkpath) {
        const pathArr = linkpath.split('/');
        pathArr.pop();
        baseURI = addUrlProtocol(`${pathArr.join('/')}/`);
      }
      return `url("${fillUpPath($1, baseURI)}")`;
    });
  }
  scopeRule(rules: CSSRule[], cssPrefix: string): string {
    let result = '';
    for (const rule of rules) {
      switch (rule.type) {
        case CssRuleEnum.STYLE_RULE:
          result += this.scopeStyleRule(rule as CSSStyleRule, cssPrefix);
          break;
        case CssRuleEnum.MEDIA_RULE:
          result += this.resetPackRule(rule as CSSMediaRule, cssPrefix, 'media');
          break;
        case CssRuleEnum.SUPPORTS_RULE:
          result += this.resetPackRule(rule as CSSSupportsRule, cssPrefix, 'supports');
          break;
        default:
          result += rule.cssText;
          break;
      }
    }
    return result.replace(/^\s+/, '');
  }
  scopeStyleRule(rule: CSSStyleRule, prefix: string): string {
    const { cssText, selectorText } = rule;
    if (/^((html[\s>~,]+body)|(html|body|:root))$/.test(selectorText)) {
      return cssText.replace(/^((html[\s>~,]+body)|(html|body|:root))/, prefix);
    }
    if (selectorText === '*') {
      return cssText.replace('*', `${prefix} *`);
    }

    const builtInRootSelectorRE = /(^|\s+)((html[\s>~]+body)|(html|body|:root))(?=[\s>~]+|$)/;

    return cssText.replace(/^[\s\S]+{/, selectors =>
      selectors.replace(/(^|,)([^,]+)/g, (all, $1, $2) => {
        if (builtInRootSelectorRE.test($2)) {
          return all.replace(builtInRootSelectorRE, prefix);
        }
        return `${$1} ${prefix} ${$2.replace(/^\s*/, '')}`;
      }),
    );
  }
  scopedLinkCSS(app: BaseModel, linkElement: HTMLLinkElement): HTMLStyleElement {
    const styleElement = this.createStyleElement();
    styleElement.setAttribute('type', 'text/css');
    const needKeepAlive = !!app.keepAlive && !(app.container instanceof ShadowRoot);
    setMarkElement(styleElement, app, needKeepAlive);
    const container = needKeepAlive ? document.head : app.container;
    try {
      if (this.code) {
        this.commonScoped(styleElement, app);
        container?.prepend(styleElement);
        linkElement && dispatchLinkOrScriptLoad(linkElement);
      } else if (linkElement.getAttribute('href')) {
        this.url = fillUpPath(linkElement.getAttribute('href')!, app.url);
        this.getCode(app).then(() => {
          this.scopedStyleCSS(app, styleElement);
          linkElement.remove();
          container?.prepend(styleElement);
          linkElement && dispatchLinkOrScriptLoad(linkElement);
          this.scoped = true;
        });
      } else {
        const observer = new MutationObserver(() => {
          if (!linkElement.href) return;
          observer.disconnect();
          this.url = fillUpPath(linkElement.getAttribute('href')!, app.url);
          this.getCode(app).then(() => {
            this.scopedStyleCSS(app, styleElement);
            linkElement.remove();
            container?.prepend(styleElement);
            linkElement && dispatchLinkOrScriptLoad(linkElement);
            this.scoped = true;
          });
        });
        observer.observe(linkElement, { attributeFilter: ['href'], childList: false, subtree: false });
      }
    } catch {
      linkElement && dispatchLinkOrScriptError(linkElement);
    }
    return styleElement;
  }
  scopedStyleCSS(app: BaseModel, styleElement: HTMLStyleElement): HTMLStyleElement {
    const needKeepAlive = !!app.keepAlive && !(app.container instanceof ShadowRoot);
    setMarkElement(styleElement, app, needKeepAlive);
    if (this.code || styleElement.textContent) {
      if (styleElement.textContent) {
        styleElement.textContent = '';
        styleElement.innerHTML = '';
      }
      if (this.linkedBaseStyle(styleElement, app)) return styleElement;
      this.commonScoped(styleElement, app);
    } else {
      const observer = new MutationObserver(() => {
        if (!(styleElement.textContent || styleElement.sheet?.cssRules?.length)) return;
        observer.disconnect();
        if (!this.linkedBaseStyle(styleElement, app)) {
          this.commonScoped(styleElement, app);
        }
      });
      observer.observe(styleElement, { attributes: false, characterData: true, childList: true, subtree: true });
    }
    this.url && styleElement.setAttribute('origin-src', this.url);
    return styleElement;
  }
}

export async function excuteAppStyles(app: BaseModel, container?: Element | ShadowRoot) {
  const styleList: Style[] = Array.from(app.source!.styles.values());
  const promiseList: Promise<HTMLStyleElement>[] = [];
  styleList.forEach(style => {
    promiseList.push(style.excuteCode(app));
  });
  await Promise.all(promiseList).then((styleElementList: HTMLStyleElement[]) => {
    const parentElemnt = container || app.container;
    if (app.keepAlive && !(parentElemnt instanceof ShadowRoot)) {
      document.head.append(...styleElementList);
    } else {
      parentElemnt?.append(...styleElementList);
    }
  });
}
