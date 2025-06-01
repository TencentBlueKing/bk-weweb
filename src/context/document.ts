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

/**
 * Document 代理模块
 * @description 为微前端应用创建代理 document 对象，实现 DOM 隔离和沙箱环境
 */

import type { BaseModel } from '../typings/model';

/**
 * 特殊元素标签名称
 * @description 这些标签在查询时需要特殊处理，通常指向宿主环境的元素
 */
const SPECIAL_ELEMENT_TAGS = ['body', 'html', 'head'] as const;

/**
 * 应用容器键名
 * @description 用于标记元素所属的微前端应用
 */
const APP_KEY_PROPERTY = '__BK_WEWEB_APP_KEY__' as const;

/**
 * 插入位置类型映射
 * @description 定义 insertAdjacentHTML 方法支持的插入位置
 */
type InsertPosition = 'afterbegin' | 'afterend' | 'beforebegin' | 'beforeend';

/**
 * ShadowRoot insertAdjacentHTML 实现
 * @description 在 ShadowRoot 环境下实现 insertAdjacentHTML 方法
 * @param app - 应用实例
 * @param where - 插入位置
 * @param domString - 要插入的 HTML 字符串
 */
function createShadowRootInsertAdjacentHTML(app: BaseModel) {
  return function shadowRootInsertAdjacentHTML(where: InsertPosition, domString: string): void {
    const temporaryContainer = document.createElement('div');
    temporaryContainer.innerHTML = domString;
    const elements = Array.from(temporaryContainer.childNodes);
    const shadow = app.container! as ShadowRoot;

    switch (where) {
      case 'beforebegin':
        for (const item of elements) {
          shadow.host.parentNode?.insertBefore(item, shadow.host);
        }
        break;
      case 'afterbegin':
        for (const item of elements.reverse()) {
          shadow.insertBefore(item, shadow.firstChild);
        }
        break;
      case 'beforeend':
        for (const item of elements) {
          shadow.appendChild(item);
        }
        break;
      case 'afterend':
        for (const item of elements) {
          shadow.host.parentNode?.insertBefore(item, shadow.host.nextSibling);
        }
        break;
    }
  };
}

/**
 * 创建代理 body 对象
 * @description 为微前端应用创建隔离的 body 代理对象
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @returns ProxyHandler<{}> - body 代理对象
 */
function createProxyBody(rawDocument: Document, app: BaseModel) {
  return new Proxy(
    {},
    {
      get(_, key) {
        // ShadowRoot 环境处理
        if (app.container instanceof ShadowRoot) {
          if (key === 'insertAdjacentHTML') {
            return createShadowRootInsertAdjacentHTML(app);
          }

          const value = Reflect.get(app.container, key);
          if (typeof value === 'function') {
            return value.bind(app.container);
          }
          if (value !== undefined) {
            return value;
          }
        }

        // 默认使用原始 document.body
        const value = Reflect.get(rawDocument.body, key);
        return typeof value === 'function' ? value.bind(rawDocument.body) : value;
      },

      set(_, key, value) {
        if (app.container instanceof ShadowRoot) {
          Reflect.set(app.container, key, value);
          return true;
        }

        Reflect.set(rawDocument.body, key, value);
        return true;
      },
    },
  );
}

/**
 * 创建元素并标记应用归属
 * @description 重写 createElement 方法，为创建的元素标记所属应用
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @returns createElement 函数
 */
function createElementWithAppKey(rawDocument: Document, app: BaseModel) {
  return function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions | undefined,
  ) {
    const element = rawDocument.createElement(tagName, options);

    // 为元素标记所属应用
    (element as HTMLElement & { [APP_KEY_PROPERTY]: string })[APP_KEY_PROPERTY] = app.appCacheKey;

    return element;
  };
}

/**
 * 检查是否为特殊元素标签
 * @description 判断选择器是否匹配特殊元素标签
 * @param selector - CSS 选择器字符串
 * @returns boolean - 是否为特殊元素标签
 */
function isSpecialElementTag(selector: string): boolean {
  return (SPECIAL_ELEMENT_TAGS as readonly string[]).includes(selector);
}

/**
 * 安全执行查询选择器
 * @description 在容器中安全执行查询，捕获可能的异常
 * @param container - 查询容器
 * @param selector - CSS 选择器
 * @returns Element | null - 查询结果
 */
function safeQuerySelector(container: Element | ShadowRoot | null | undefined, selector: string): Element | null {
  try {
    return container?.querySelector(selector) ?? null;
  } catch {
    return null;
  }
}

/**
 * 安全执行查询所有选择器
 * @description 在容器中安全执行查询所有，捕获可能的异常
 * @param container - 查询容器
 * @param selector - CSS 选择器
 * @returns NodeListOf<Element> - 查询结果集合
 */
function safeQuerySelectorAll(
  container: Element | ShadowRoot | null | undefined,
  selector: string,
): NodeListOf<Element> {
  try {
    return container?.querySelectorAll(selector) ?? ([] as unknown as NodeListOf<Element>);
  } catch {
    return [] as unknown as NodeListOf<Element>;
  }
}

/**
 * 创建代理查询选择器方法
 * @description 重写 querySelector 方法，支持容器隔离
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @param proxyBody - 代理 body 对象
 * @returns querySelector 函数
 */
function createProxyQuerySelector(rawDocument: Document, app: BaseModel, proxyBody: unknown) {
  return function querySelectorNew(this: Document, selectors: string): Element | null {
    if (selectors === proxyBody) {
      return app.container instanceof ShadowRoot ? (app.container as unknown as Element) : rawDocument.body;
    }

    if (isSpecialElementTag(selectors)) {
      if (app?.container instanceof ShadowRoot) {
        return app?.container as unknown as Element;
      }
      return rawDocument.querySelector.call(this, selectors);
    }

    return safeQuerySelector(app?.container, selectors);
  };
}

/**
 * 创建代理查询所有选择器方法
 * @description 重写 querySelectorAll 方法，支持容器隔离
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @returns querySelectorAll 函数
 */
function createProxyQuerySelectorAll(rawDocument: Document, app: BaseModel) {
  return function querySelectorAllNew(selectors: string): NodeListOf<Element> {
    if (isSpecialElementTag(selectors)) {
      if (app?.container instanceof ShadowRoot) {
        return [app?.container] as unknown as NodeListOf<Element>;
      }
      const result = rawDocument.querySelector(selectors);
      return result ? ([result] as unknown as NodeListOf<Element>) : ([] as unknown as NodeListOf<Element>);
    }

    return safeQuerySelectorAll(app?.container, selectors);
  };
}

/**
 * 创建代理 getElementById 方法
 * @description 重写 getElementById 方法，支持容器隔离
 * @param rawDocument - 原始 document 对象
 * @param querySelector - 代理的 querySelector 方法
 * @returns getElementById 函数
 */
function createProxyGetElementById(
  rawDocument: Document,
  querySelector: (this: Document, selectors: string) => Element | null,
) {
  return function getElementByIdNew(id: string): HTMLElement | null {
    return querySelector.call(rawDocument, `#${id}`) as HTMLElement | null;
  };
}

/**
 * 创建代理 getElementsByClassName 方法
 * @description 重写 getElementsByClassName 方法，支持容器隔离
 * @param querySelectorAll - 代理的 querySelectorAll 方法
 * @returns getElementsByClassName 函数
 */
function createProxyGetElementsByClassName(querySelectorAll: (selectors: string) => NodeListOf<Element>) {
  return function getElementsByClassName(className: string): HTMLCollectionOf<Element> {
    return querySelectorAll(`.${className}`) as unknown as HTMLCollectionOf<Element>;
  };
}

/**
 * 创建代理 getElementsByTagName 方法
 * @description 重写 getElementsByTagName 方法，支持容器隔离
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @param querySelectorAll - 代理的 querySelectorAll 方法
 * @returns getElementsByTagName 函数
 */
function createProxyGetElementsByTagName(
  rawDocument: Document,
  app: BaseModel,
  querySelectorAll: (selectors: string) => NodeListOf<Element>,
) {
  return function getElementsByTagName<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
  ): HTMLCollectionOf<HTMLElementTagNameMap[K]> {
    if (isSpecialElementTag(tagName) || (!app?.showSourceCode && tagName.toLowerCase() === 'script')) {
      return rawDocument.getElementsByTagName(tagName);
    }

    return querySelectorAll(tagName) as unknown as HTMLCollectionOf<HTMLElementTagNameMap[K]>;
  };
}

/**
 * 创建代理 getElementsByName 方法
 * @description 重写 getElementsByName 方法，支持容器隔离
 * @param querySelectorAll - 代理的 querySelectorAll 方法
 * @returns getElementsByName 函数
 */
function createProxyGetElementsByName(querySelectorAll: (selectors: string) => NodeListOf<Element>) {
  return function getElementsByNameNew(name: string): NodeListOf<HTMLElement> {
    return querySelectorAll(`[name="${name}"]`) as unknown as NodeListOf<HTMLElement>;
  };
}

/**
 * 创建代理 document 方法映射
 * @description 创建所有需要代理的 document 方法
 * @param rawDocument - 原始 document 对象
 * @param app - 应用实例
 * @param proxyBody - 代理 body 对象
 * @returns 代理方法映射对象
 */
function createProxyMethodMap(rawDocument: Document, app: BaseModel, proxyBody: unknown) {
  const createElement = createElementWithAppKey(rawDocument, app);
  const querySelector = createProxyQuerySelector(rawDocument, app, proxyBody);
  const querySelectorAll = createProxyQuerySelectorAll(rawDocument, app);
  const getElementById = createProxyGetElementById(rawDocument, querySelector);
  const getElementsByClassName = createProxyGetElementsByClassName(querySelectorAll);
  const getElementsByTagName = createProxyGetElementsByTagName(rawDocument, app, querySelectorAll);
  const getElementsByName = createProxyGetElementsByName(querySelectorAll);

  return {
    createElement: createElement.bind(rawDocument),
    querySelector: querySelector.bind(rawDocument),
    querySelectorAll: querySelectorAll.bind(rawDocument),
    getElementById: getElementById.bind(rawDocument),
    getElementsByClassName: getElementsByClassName.bind(rawDocument),
    getElementsByTagName: getElementsByTagName.bind(rawDocument),
    getElementsByName: getElementsByName.bind(rawDocument),
  };
}

/**
 * 创建代理 document 对象
 * @description 为微前端应用创建隔离的 document 代理对象，实现 DOM 隔离
 *
 * 主要功能：
 * 1. 代理 body 对象，支持 ShadowRoot 环境
 * 2. 重写 DOM 查询方法，实现容器隔离
 * 3. 标记创建的元素归属，便于应用管理
 * 4. 支持特殊元素标签的原生访问
 *
 * @param rawDocument - 原始 document 对象
 * @param app - 微前端应用实例
 * @returns Document - 代理后的 document 对象
 *
 * @example
 * ```typescript
 * const proxyDoc = createProxyDocument(document, appInstance);
 * // 使用代理后的 document 进行 DOM 操作
 * const element = proxyDoc.createElement('div');
 * const result = proxyDoc.querySelector('.my-class');
 * ```
 */
export const createProxyDocument = (rawDocument: Document, app: BaseModel): Document => {
  const fakeDocument = {};
  const proxyBody = createProxyBody(rawDocument, app);
  const methodMap = createProxyMethodMap(rawDocument, app, proxyBody);

  return new Proxy(fakeDocument, {
    get(_, key: string | symbol) {
      if (key === 'body') {
        return proxyBody;
      }

      if (typeof key === 'string' && key in methodMap) {
        return methodMap[key as keyof typeof methodMap];
      }

      // 默认处理：获取原始 document 的属性或方法
      const result = Reflect.get(rawDocument, key);
      return typeof result === 'function' ? result.bind(rawDocument) : result;
    },
  }) as Document;
};
