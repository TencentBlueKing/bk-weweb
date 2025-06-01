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
 * 主应用资源收集模块
 * @description 收集和管理主应用的样式资源，为微应用提供基础资源共享能力
 */

import { appCache } from '../cache/app-cache';
import { Style } from '../entry/style';
import { randomUrl } from '../utils/common';
import { baseElementAppendHandle, baseElementInertHandle } from './element';

/**
 * 缓存原始 DOM 操作方法
 * @description 获取并缓存原始的 DOM 操作方法
 * @returns OriginalDOMMethodsCache - 原始方法缓存对象
 */
function cacheOriginalDOMMethods() {
  return {
    rawBodyAppendChild: HTMLBodyElement.prototype.appendChild,
    rawHeadAppendChild: HTMLHeadElement.prototype.appendChild,
    rawHeadInsertBefore: HTMLHeadElement.prototype.insertBefore,
  };
}
export type OriginalDOMMethodsCache = ReturnType<typeof cacheOriginalDOMMethods>;
/**
 * 重写 DOM 操作方法
 * @description 重写 body 和 head 的 DOM 操作方法
 * @param originalMethods - 原始方法缓存对象
 */
function overrideDOMMethods(originalMethods: OriginalDOMMethodsCache): void {
  const { rawBodyAppendChild, rawHeadAppendChild, rawHeadInsertBefore } = originalMethods;

  // 重写 HTMLBodyElement 的 appendChild 方法
  HTMLBodyElement.prototype.appendChild = function <T extends Node>(newChild: T): T {
    return baseElementAppendHandle<Node>(this, newChild, rawBodyAppendChild) as unknown as T;
  };

  // 重写 HTMLHeadElement 的 appendChild 方法
  HTMLHeadElement.prototype.appendChild = function <T extends Node>(newChild: T): T {
    return baseElementAppendHandle<Node>(this, newChild, rawHeadAppendChild) as unknown as T;
  };

  // 重写 HTMLHeadElement 的 insertBefore 方法
  HTMLHeadElement.prototype.insertBefore = function <T extends Node>(newChild: T, refChild: Node | null): T {
    return baseElementInertHandle<Node>(this, newChild, refChild, rawHeadInsertBefore) as unknown as T;
  };
}

/**
 * @description 收集主应用的样式资源
 */
function collectExistingStyles(): void {
  const styleNodes = document.head.querySelectorAll('style');

  for (const styleNode of Array.from(styleNodes)) {
    const textContent = styleNode.textContent;

    if (textContent) {
      try {
        const style = new Style({
          code: textContent,
          fromHtml: false,
          url: '',
        });

        appCache.setBaseAppStyle(randomUrl(), style);
      } catch (error) {
        console.warn('Failed to collect style element:', error);
      }
    }
  }
}

/**
 * @description 在页面加载完成后开始收集主应用的资源
 */
function setupLoadEventListener(): void {
  window.addEventListener('load', collectExistingStyles);
}

/**
 * 收集主应用的静态资源
 * @description 主要入口函数，用于初始化主应用静态资源收集机制
 *
 * 功能包括：
 * 1. 重写 DOM 操作方法以拦截新增的样式和脚本元素
 * 2. 收集页面加载时已存在的样式元素
 * 3. 将收集到的资源存储到基础应用缓存中
 *
 *
 * @example
 * ```typescript
 * // 在主应用初始化时调用
 * collectBaseSource();
 * ```
 */
export function collectBaseSource(): void {
  // 缓存原始 DOM 操作方法
  const originalMethods = cacheOriginalDOMMethods();

  // 重写 DOM 操作方法以拦截资源添加
  overrideDOMMethods(originalMethods);

  // 设置页面加载完成后的资源收集
  setupLoadEventListener();
}
