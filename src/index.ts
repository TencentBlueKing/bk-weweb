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

import { collectBaseSource } from './base-app/collect-source';
import BkWewebElement from './component/web-component';
import './context/cache';

import type { FetchSourceType, IStartOption } from './typings';
export * from './lifecycle/activated';
export * from './lifecycle/deactivated';
export * from './lifecycle/load';
export * from './lifecycle/mount';
export * from './lifecycle/unload';
export * from './lifecycle/unmount';
export * from './preload/preload';
export { WewebMode } from './typings';

const CUSTOM_ELEMENT_TAG = 'bk-weweb';

export class WeWeb {
  fetchSource?: FetchSourceType;
  webComponentTag = CUSTOM_ELEMENT_TAG;

  constructor() {
    if (!window.customElements.get(CUSTOM_ELEMENT_TAG)) {
      window.customElements.define(CUSTOM_ELEMENT_TAG, BkWewebElement);
    }
  }

  /** 设置自定义DOM标签名 */
  setWebComponentTag() {
    if (!window.customElements.get(this.webComponentTag)) {
      window.customElements.define(this.webComponentTag, BkWewebElement);
    }
  }

  /** 启动WeWeb */
  start(option?: IStartOption) {
    if (option?.collectBaseSource) {
      collectBaseSource();
    }
    if (typeof option?.fetchSource === 'function') {
      this.fetchSource = option.fetchSource;
    }
    this.webComponentTag = option?.webComponentTag || CUSTOM_ELEMENT_TAG;
    this.setWebComponentTag();
  }
}

const weWeb = new WeWeb();
export default weWeb;
