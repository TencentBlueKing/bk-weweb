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
 * 挂载生命周期模块
 * @description 提供应用挂载到指定容器的功能
 */

import { appCache } from '../cache/app-cache';
import { nextTask } from '../utils/common';
import { beforeLoad } from './before-load';

import type { BaseModel } from '../typings';

/**
 * 挂载应用到指定容器
 * @description 将已加载的应用挂载到指定的 DOM 容器或 ShadowRoot 中
 * @template T - 导出实例的类型
 * @param appKey - 应用的唯一标识符
 * @param container - 挂载容器，可以是 HTMLElement 或 ShadowRoot（可选）
 * @param callback - 挂载完成后的回调函数（可选）
 */
export function mount<T>(
  appKey: string,
  container?: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void {
  const app = appCache.getApp(appKey);

  if (app) {
    nextTask(() => {
      beforeLoad();
      app.mount(container, callback);
    });
  }
}
