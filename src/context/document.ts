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
import { getCurrentRunningApp } from './cache';

const { document } = window;
const {
  createElement,
  getElementById,
  getElementsByClassName,
  getElementsByName,
  getElementsByTagName,
  querySelector,
  querySelectorAll,
} = Document.prototype;
const { querySelector: bodyQuerySelector } = HTMLBodyElement.prototype;
const SPECIAL_ELEMENT_TAG = ['body', 'html', 'head'];
let hasRewrite = false;
export function rewriteDocumentPrototypeMethods() {
  if (hasRewrite) return;
  hasRewrite = true;
  Document.prototype.createElement = function <K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions | undefined,
  ) {
    const element = createElement.call(this, tagName, options);
    const app = getCurrentRunningApp();
    // img.src = 'xxx' iframe.src = 'xxx' 均不能在setAttributes上监听 但是这里所有的src都是 全地址 无法判断是否需要添加子应用域名
    // if (tagName.toLocaleLowerCase() === 'img') {
    //   const observer = new MutationObserver((list, observer) =>  {
    //     observer.disconnect();
    //     const url = new URL((element as HTMLImageElement).src)
    //     (element as HTMLImageElement).src = `${}`
    //   });
    //   observer.observe(element, { attributeFilter: ['src'], subtree: false, childList: false });
    // }
    if (app) element.__BK_WEWEB_APP_KEY__ = app.appCacheKey;
    return element;
  };
  /**
   * 查询选择器的新方法
   * @param selectors 选择器字符串
   * @returns 匹配的元素或 null
   */
  function querySelectorNew(this: Document, selectors: string): any {
    const app = getCurrentRunningApp();
    if (selectors.includes('data-bk-mask-uid')) debugger;
    // 如果选择器是特殊元素标签
    if (SPECIAL_ELEMENT_TAG.includes(selectors)) {
      // 如果当前应用程序容器是 ShadowRoot 类型
      if (app?.container instanceof ShadowRoot) {
        return app?.container;
      }
      if (this instanceof HTMLBodyElement) return bodyQuerySelector.call(this, selectors);
      // 否则调用原始的 querySelector 方法
      return querySelector.call(this, selectors);
    }

    // 如果没有当前应用程序或选择器为空或文档不是当前文档
    if (!app || !selectors || ![document, document.body].includes(this)) {
      if (this instanceof HTMLBodyElement) return bodyQuerySelector.call(this, selectors);
      // 调用原始的 querySelector 方法
      return querySelector.call(this, selectors);
    }

    // 返回当前应用程序容器中匹配选择器的元素，如果没有匹配的元素则返回 null
    return app?.container?.querySelector(selectors) ?? null;
  }

  /**
   * 重写了 Document 类的 querySelectorAll 方法
   * @param selectors - 要查询的选择器
   * @returns 匹配到的元素列表或空数组
   */
  function querySelectorAllNew(this: Document, selectors: string): any {
    const app = getCurrentRunningApp();

    // 如果选择器是特殊元素标签，则返回容器元素或调用原生 querySelector 方法
    if (SPECIAL_ELEMENT_TAG.includes(selectors)) {
      if (app?.container instanceof ShadowRoot) {
        return app?.container;
      }
      return querySelector.call(this, selectors);
    }

    // 如果没有运行中的应用程序、选择器为空或文档不是当前文档，则调用原生 querySelectorAll 方法
    if (!app || !selectors || document !== this) {
      return querySelectorAll.call(this, selectors);
    }

    // 返回运行中应用程序的容器元素中匹配到的元素列表或空数组
    return app?.container?.querySelectorAll(selectors) ?? [];
  }

  Document.prototype.querySelector = querySelectorNew;
  Document.prototype.querySelectorAll = querySelectorAllNew;
  HTMLBodyElement.prototype.querySelector = querySelectorNew;
  Document.prototype.getElementById = function getElementByIdNew(key: string): HTMLElement | null {
    return getCurrentRunningApp() ? querySelectorNew.call(this, `#${key}`) : getElementById.call(this, key);
  };
  Document.prototype.getElementsByClassName = function (key: string): HTMLCollectionOf<Element> {
    return getCurrentRunningApp() ? querySelectorAllNew.call(this, `.${key}`) : getElementsByClassName.call(this, key);
  };
  // eslint-disable-next-line max-len
  Document.prototype.getElementsByTagName = function <K extends keyof HTMLElementTagNameMap>(
    key: K,
  ): HTMLCollectionOf<Element> {
    const app = getCurrentRunningApp();
    if (!app || SPECIAL_ELEMENT_TAG.includes(key) || (!app?.showSourceCode && key.toLocaleLowerCase() === 'script')) {
      return getElementsByTagName.call(this, key);
    }
    return querySelectorAllNew.call(this, key);
  };
  Document.prototype.getElementsByName = function (key: string): NodeListOf<HTMLElement> {
    return getCurrentRunningApp() ? querySelectorAllNew.call(this, `[name=${key}]`) : getElementsByName.call(this, key);
  };
}

export function resetDocumentPrototypeMethods(): void {
  Document.prototype.createElement = createElement;
  Document.prototype.querySelector = querySelector;
  HTMLBodyElement.prototype.querySelector = bodyQuerySelector;
  Document.prototype.querySelectorAll = querySelectorAll;
  Document.prototype.getElementById = getElementById;
  Document.prototype.getElementsByClassName = getElementsByClassName;
  Document.prototype.getElementsByTagName = getElementsByTagName;
  Document.prototype.getElementsByName = getElementsByName;
  hasRewrite = false;
}
