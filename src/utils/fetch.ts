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
import weWeb from '..';

import type { BaseModel } from '../typings';

type FetchOptions = Record<string, unknown>;

/**
 * 统一的资源获取方法，支持应用级别和全局级别的自定义fetch
 * 优先级：应用级fetchSource > 全局fetchSource > 原生fetch
 * @param url 要获取的资源URL
 * @param options fetch请求选项，默认为空对象
 * @param app 可选的应用实例，如果提供且有自定义fetchSource则优先使用
 * @returns Promise<string> 返回资源内容的Promise，失败时返回空字符串
 */
export const fetchSource = async (url: string, options: FetchOptions = {}, app?: BaseModel): Promise<string> => {
  // 优先使用应用级别的自定义fetch方法
  if (typeof app?.fetchSource === 'function') {
    try {
      return await app.fetchSource(url, options);
    } catch {
      return '';
    }
  }

  // 其次使用全局自定义fetch方法
  if (weWeb.fetchSource) {
    return weWeb.fetchSource(url, options);
  }

  // 最后使用原生fetch方法
  try {
    const response = await window.fetch(url, options as RequestInit);
    return await response.text();
  } catch {
    return '';
  }
};
