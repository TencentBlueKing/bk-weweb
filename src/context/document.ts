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
import type { BaseModel } from '../typings/model';
const SPECIAL_ELEMENT_TAG = ['body', 'html', 'head'];
/**
 * 创建代理的document
 * @param rawDocument 原始document
 * @param app 应用实例
 * @returns 代理的document
 */
export const createProxyDocument = (rawDocument: Document, app: BaseModel) => {
  const fakeDocument = {};
  function shadowRootInsertAdjacentHTML(where: InsertPosition, domString: string) {
    const temporaryContainer = document.createElement('div');
    temporaryContainer.innerHTML = domString;
    const elements = Array.from(temporaryContainer.childNodes);
    const shadow = app.container! as ShadowRoot;
    switch (where) {
      case 'beforebegin':
        elements.forEach(el => shadow.host.parentNode?.insertBefore(el, shadow.host));
        break;
      case 'afterbegin':
        elements.reverse().forEach(el => shadow.insertBefore(el, shadow.firstChild));
        break;
      case 'beforeend':
        elements.forEach(el => shadow.appendChild(el));
        break;
      case 'afterend':
        elements.forEach(el => shadow.host.parentNode?.insertBefore(el, shadow.host.nextSibling));
        break;
    }
  }
  const proxyBody = new Proxy(
    {},
    {
      get(_, key) {
        // ShadowRoot 处理逻辑简化
        if (app.container instanceof ShadowRoot) {
          if (key === 'insertAdjacentHTML') {
            // shadowRoot 中没有 insertAdjacentHTML
            return shadowRootInsertAdjacentHTML.bind(app.container);
          }
          const value = app.container[key];
          if (typeof value === 'function') {
            return value.bind(app.container);
          }
          if (value !== undefined) {
            return value;
          }
        }
        // 直接返回 rawDocument.body 的属性或绑定函数
        const value = Reflect.get(rawDocument.body, key);
        return typeof value === 'function' ? value.bind(rawDocument.body) : value;
      },
      set(_, key, value) {
        // ShadowRoot 处理逻辑简化
        if (app.container instanceof ShadowRoot) {
          app.container[key] = value;
          return true;
        }
        // 直接设置 rawDocument.body 的属性
        Reflect.set(rawDocument.body, key, value);
        return true;
      },
    },
  );
  /**
   * @param tagName 标签名
   * @param options 选项
   * @returns
   */
  function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions | undefined,
  ) {
    const element = rawDocument.createElement(tagName, options);
    // img.src = 'xxx' iframe.src = 'xxx' 均不能在setAttributes上监听 但是这里所有的src都是 全地址 无法判断是否需要添加子应用域名
    // if (tagName.toLocaleLowerCase() === 'img') {
    //   const observer = new MutationObserver((list, observer) =>  {
    //     observer.disconnect();
    //     const url = new URL((element as HTMLImageElement).src)
    //     (element as HTMLImageElement).src = `${}`
    //   });
    //   observer.observe(element, { attributeFilter: ['src'], subtree: false, childList: false });
    // }
    element.__BK_WEWEB_APP_KEY__ = app.appCacheKey;
    return element;
  }
  /**
   * 查询选择器的新方法
   * @param selectors 选择器字符串
   * @returns 匹配的元素或 null
   */
  function querySelectorNew(this: Document, selectors: string) {
    if (selectors === proxyBody) {
      return app.container instanceof ShadowRoot ? app.container : rawDocument.body;
    }
    // 如果选择器是特殊元素标签
    if (SPECIAL_ELEMENT_TAG.includes(selectors)) {
      // 如果当前应用程序容器是 ShadowRoot 类型
      if (app?.container instanceof ShadowRoot) {
        return app?.container;
      }
      // 否则调用原始的 querySelector 方法
      return rawDocument.querySelector.call(this, selectors);
    }
    // 返回当前应用程序容器中匹配选择器的元素，如果没有匹配的元素则返回 null
    try {
      return app?.container?.querySelector(selectors) ?? null;
    } catch {
      return null;
    }
  }
  /**
   * 重写了 Document 类的 querySelectorAll 方法
   * @param selectors - 要查询的选择器
   * @returns 匹配到的元素列表或空数组
   */
  function querySelectorAllNew(selectors: string) {
    // 如果选择器是特殊元素标签，则返回容器元素或调用原生 querySelector 方法
    if (SPECIAL_ELEMENT_TAG.includes(selectors)) {
      if (app?.container instanceof ShadowRoot) {
        return app?.container;
      }
      return rawDocument.querySelector(selectors);
    }
    // 返回运行中应用程序的容器元素中匹配到的元素列表或空数组
    return app?.container?.querySelectorAll(selectors) ?? [];
  }
  function getElementByIdNew(key: string) {
    return querySelectorNew.call(rawDocument, `#${key}`);
  }
  function getElementsByClassName(key: string) {
    return querySelectorAllNew(`.${key}`);
  }
  function getElementsByTagName<K extends keyof HTMLElementTagNameMap>(key: K) {
    if (SPECIAL_ELEMENT_TAG.includes(key) || (!app?.showSourceCode && key.toLocaleLowerCase() === 'script')) {
      return rawDocument.getElementsByTagName(key);
    }
    return querySelectorAllNew(key);
  }
  function getElementsByNameNew(key: string) {
    return querySelectorAllNew(`[name=${key}]`);
  }
  return new Proxy(fakeDocument, {
    get(_, key: string | symbol) {
      if (key === 'createElement') {
        return createElement.bind(rawDocument);
      }
      if (key === 'querySelector') {
        return querySelectorNew.bind(rawDocument);
      }
      if (key === 'querySelectorAll') {
        return querySelectorAllNew.bind(rawDocument);
      }
      if (key === 'getElementById') {
        return getElementByIdNew.bind(rawDocument);
      }
      if (key === 'getElementsByClassName') {
        return getElementsByClassName.bind(rawDocument);
      }
      if (key === 'getElementsByTagName') {
        return getElementsByTagName.bind(rawDocument);
      }
      if (key === 'getElementsByName') {
        return getElementsByNameNew.bind(rawDocument);
      }
      if (key === 'body') {
        return proxyBody;
      }
      const result = Reflect.get(rawDocument, key);
      if (typeof result === 'function') {
        return result.bind(rawDocument);
      }
      return result;
    },
  });
};
