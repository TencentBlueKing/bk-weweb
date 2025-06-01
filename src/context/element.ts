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
 * DOM 元素方法重写模块
 * @description 重写 Body 和 Header 的 DOM 操作方法，实现微前端应用的 DOM 隔离和资源路径处理
 */

import { appCache } from '../cache/app-cache';
import { fillUpPath } from '../utils/common';
import { elementInsertHandler, elementAppendHandler, isSpecialElement, type DOMMethod } from '../utils/element';
import { setCurrentRunningApp } from './cache';

/**
 * 支持的资源属性名称
 * @description 需要进行路径补全处理的属性
 */
const RESOURCE_ATTRIBUTES = ['src', 'srcset'];

/**
 * 支持的链接属性名称
 * @description 链接元素需要进行路径补全处理的属性
 */
const LINK_ATTRIBUTES = ['href'];

/**
 * 支持资源属性的标签名称
 * @description 这些标签的资源属性需要进行路径补全
 */
const RESOURCE_TAG_NAMES = ['IMG', 'SCRIPT'];

/**
 * 支持链接属性的标签名称
 * @description 这些标签的链接属性需要进行路径补全
 */
const LINK_TAG_NAMES = ['LINK'];

// 保存原始的 DOM 方法
const { setAttribute } = Element.prototype;

const {
  append,
  appendChild: bodyAppendChild,
  insertBefore: bodyInsertBefore,
  removeChild: bodyRemoveChild,
} = HTMLBodyElement.prototype;

const {
  appendChild: headAppendChild,
  insertBefore: headInsertBefore,
  removeChild: headRemoveChild,
} = HTMLHeadElement.prototype;

const rawHead = document.head;
let hasRewrite = false;

/**
 * 检查是否需要处理资源路径
 * @description 判断元素属性是否需要进行路径补全处理
 * @param key - 属性名称
 * @param tagName - 元素标签名称
 * @returns boolean - 是否需要处理
 */
function shouldProcessResourcePath(key: string, tagName: string): boolean {
  const upperTagName = tagName.toUpperCase();

  return (
    (RESOURCE_ATTRIBUTES.includes(key) && RESOURCE_TAG_NAMES.includes(upperTagName)) ||
    (LINK_ATTRIBUTES.includes(key) && LINK_TAG_NAMES.includes(upperTagName))
  );
}

/**
 * 获取元素的应用信息
 * @description 根据元素的应用标识获取对应的应用实例
 * @param element - 元素对象
 * @returns 应用实例或 null
 */
function getElementApp(element: Element) {
  if (!element.__BK_WEWEB_APP_KEY__) {
    return null;
  }

  return appCache.getApp(element.__BK_WEWEB_APP_KEY__);
}

/**
 * 创建重写的 setAttribute 方法
 * @description 重写 setAttribute 方法，处理资源路径补全
 * @returns 重写后的 setAttribute 方法
 */
function createOverriddenSetAttribute() {
  return function (this: Element, key: string, value: string): void {
    const tagName = this.tagName.toUpperCase();

    // 处理需要路径补全的资源属性
    if (shouldProcessResourcePath(key, tagName) && this.__BK_WEWEB_APP_KEY__) {
      const app = getElementApp(this);

      if (app) {
        // 补全相对路径
        setAttribute.call(this, key, fillUpPath(value, app.url));
        return;
      }
    }

    // 默认调用原始方法
    setAttribute.call(this, key, value);
  };
}

/**
 * 处理 keepAlive 模式的特殊元素
 * @description 将 keepAlive 模式的特殊元素添加到 head 中
 * @param newChild - 要添加的子元素
 * @returns 添加的元素或 null
 */
function handleKeepAliveElement<T extends Node>(newChild: T): T | null {
  if (newChild.__KEEP_ALIVE__ && isSpecialElement(newChild)) {
    return headAppendChild.call(rawHead, newChild) as T;
  }

  return null;
}

/**
 * 创建重写的 appendChild 方法
 * @description 重写 appendChild 方法，支持 DOM 隔离和 keepAlive 处理
 * @returns 重写后的 appendChild 方法
 */
function createOverriddenAppendChild() {
  return function <T extends Node>(this: HTMLElement, newChild: T): T {
    // keepAlive 模式的特殊元素放到 head 中
    const keepAliveResult = handleKeepAliveElement(newChild);
    if (keepAliveResult) {
      return keepAliveResult;
    }

    // 使用元素处理器进行常规处理
    return elementAppendHandler(this, newChild, bodyAppendChild as DOMMethod) as T;
  };
}

/**
 * 创建重写的 append 方法
 * @description 重写 append 方法，支持多节点添加和 keepAlive 处理
 * @returns 重写后的 append 方法
 */
function createOverriddenAppend() {
  return function <T extends Node>(this: HTMLElement, ...nodes: T[]): void {
    // biome-ignore lint/complexity/noForEach: <explanation>
    nodes.forEach(node => {
      // keepAlive 模式的特殊元素放到 head 中
      const keepAliveResult = handleKeepAliveElement(node);
      if (keepAliveResult) {
        return;
      }

      // 使用元素处理器进行常规处理
      elementAppendHandler(this, node as Node, bodyAppendChild as DOMMethod);
    });
  };
}

/**
 * 创建重写的 insertBefore 方法
 * @description 重写 insertBefore 方法，支持 DOM 隔离
 * @returns 重写后的 insertBefore 方法
 */
function createOverriddenInsertBefore() {
  return function <T extends Node>(this: HTMLElement, newChild: T, refChild: Node | null): T {
    return elementInsertHandler(this, newChild, refChild, headInsertBefore as DOMMethod) as T;
  };
}

/**
 * 创建重写的 removeChild 方法
 * @description 重写 removeChild 方法，支持从应用容器中移除元素
 * @returns 重写后的 removeChild 方法
 */
function createOverriddenRemoveChild() {
  return function <T extends Node>(this: HTMLElement, oldChild: T): T {
    const app = oldChild.__BK_WEWEB_APP_KEY__ ? appCache.getApp(oldChild.__BK_WEWEB_APP_KEY__) : null;

    // 从应用容器中移除
    if (app?.container?.contains(oldChild)) {
      return bodyRemoveChild.call(app.container, oldChild) as T;
    }

    // 从当前容器中移除
    if (this.contains(oldChild)) {
      return bodyRemoveChild.call(this, oldChild) as T;
    }

    return oldChild;
  };
}

/**
 * 重写 Body 和 Header 的 DOM 操作方法
 * @description 实现微前端应用的 DOM 隔离和资源路径处理
 *
 * 主要功能：
 * 1. 重写 setAttribute 方法，自动补全资源路径
 * 2. 重写 appendChild 和 append 方法，支持 DOM 隔离
 * 3. 重写 insertBefore 方法，支持元素插入隔离
 * 4. 重写 removeChild 方法，支持从应用容器中移除元素
 * 5. 支持 keepAlive 模式的特殊元素处理
 *
 *
 * @example
 * ```typescript
 * // 在微前端应用初始化时调用
 * rewriteBodyAndHeaderMethods();
 * ```
 */
export function rewriteBodyAndHeaderMethods(): void {
  if (hasRewrite) {
    return;
  }

  hasRewrite = true;

  // 重写 Element 的 setAttribute 方法
  Element.prototype.setAttribute = createOverriddenSetAttribute();

  // 重写 HTMLBodyElement 的方法
  HTMLBodyElement.prototype.appendChild = createOverriddenAppendChild();
  HTMLBodyElement.prototype.append = createOverriddenAppend();
  HTMLBodyElement.prototype.insertBefore = createOverriddenInsertBefore();
  HTMLBodyElement.prototype.removeChild = createOverriddenRemoveChild();

  // 重写 HTMLHeadElement 的方法（复用 Body 的实现）
  HTMLHeadElement.prototype.appendChild = HTMLBodyElement.prototype.appendChild;
  HTMLHeadElement.prototype.insertBefore = createOverriddenInsertBefore();
  HTMLHeadElement.prototype.removeChild = HTMLBodyElement.prototype.removeChild;
}

/**
 * 重置 Body 和 Header 方法
 * @description 恢复原始 DOM 操作方法，清理微前端相关的修改
 *
 * 主要功能：
 * 1. 恢复所有被重写的 DOM 方法到原始状态
 * 2. 清理当前运行的应用状态
 * 3. 重置重写状态标识
 *
 *
 * @example
 * ```typescript
 * // 在微前端应用卸载时调用
 * resetBodyAndHeaderMethods();
 * ```
 */
export function resetBodyAndHeaderMethods(): void {
  setCurrentRunningApp(null);

  // 恢复所有原始方法
  Element.prototype.setAttribute = setAttribute;
  HTMLBodyElement.prototype.appendChild = bodyAppendChild;
  HTMLBodyElement.prototype.append = append;
  HTMLBodyElement.prototype.removeChild = bodyRemoveChild;
  HTMLBodyElement.prototype.insertBefore = bodyInsertBefore;
  HTMLHeadElement.prototype.appendChild = headAppendChild;
  HTMLHeadElement.prototype.insertBefore = headInsertBefore;
  HTMLHeadElement.prototype.removeChild = headRemoveChild;

  hasRewrite = false;
}
