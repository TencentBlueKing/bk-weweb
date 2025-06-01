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
 * 预加载模块
 * @description 提供微应用、模块实例和资源的预加载功能，利用浏览器空闲时间进行资源预加载以提升性能
 */

/* eslint-disable @typescript-eslint/no-misused-promises */
import { loadApp, loadInstance } from '../lifecycle/load';
import { requestIdleCallback } from '../utils/common';
import { type SourceType, loadGlobalSource } from '../utils/load-source';

import type { IAppModelProps, IJsModelProps } from '../typings';

/**
 * 预加载模块实例
 * @description 在浏览器空闲时预加载指定的模块实例，提前准备资源以提升后续加载性能
 * @param options - 模块加载配置参数
 * @param options.isPreLoad - 将被自动设置为 true，标识这是预加载操作
 * @example
 * ```typescript
 * preLoadInstance({
 *   name: 'my-module',
 *   url: 'https://example.com/module.js'
 * });
 * ```
 */
export function preLoadInstance(options: IJsModelProps): void {
  requestIdleCallback(() =>
    loadInstance({
      ...options,
      isPreLoad: true,
    }),
  );
}

/**
 * 预加载微应用
 * @description 在浏览器空闲时预加载指定的微应用，提前准备应用资源以提升后续加载性能
 * @param options - 应用加载配置参数
 * @param options.isPreLoad - 将被自动设置为 true，标识这是预加载操作
 * @example
 * ```typescript
 * preLoadApp({
 *   name: 'my-app',
 *   entry: 'https://example.com/app/'
 * });
 * ```
 */
export function preLoadApp(options: IAppModelProps): void {
  requestIdleCallback(() =>
    loadApp({
      ...options,
      isPreLoad: true,
    }),
  );
}

/**
 * 预加载全局资源
 * @description 在浏览器空闲时预加载指定的全局资源列表，包括样式文件、脚本文件等
 * @param sourceList - 要预加载的资源列表，可以是单个资源或资源数组
 * @example
 * ```typescript
 * // 预加载单个资源
 * preLoadSource('https://example.com/style.css');
 *
 * // 预加载多个资源
 * preLoadSource([
 *   'https://example.com/style.css',
 *   'https://example.com/script.js'
 * ]);
 * ```
 */
export function preLoadSource(sourceList: SourceType): void {
  requestIdleCallback(() => {
    loadGlobalSource(sourceList);
  });
}
