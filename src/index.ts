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
import BkWewebElement from './component/web-compnent';
import './context/cache';
import { FetchSourceType, IStartOption } from './typings';
export * from './lifecircle/load';
export * from './lifecircle/mount';
export * from './lifecircle/unload';
export * from './lifecircle/unmount';
export * from './lifecircle/activated';
export * from './lifecircle/deactivated';
export * from './preload/preload';
export { WewebMode } from './typings';
const CUSTOM_ELEMENT_TAG = 'bk-weweb';
export class WeWeb {
  fetchSource?: FetchSourceType;
  webcomponentTag = CUSTOM_ELEMENT_TAG;
  constructor() {
    if (!window.customElements.get(CUSTOM_ELEMENT_TAG)) {
      window.customElements.define(CUSTOM_ELEMENT_TAG, BkWewebElement);
    }
  }
  // 设置自定义dom标签名
  setWebComponentTag() {
    if (!window.customElements.get(this.webcomponentTag)) {
      window.customElements.define(this.webcomponentTag, BkWewebElement);
    }
  }
  // todo set some global start props
  start(option?: IStartOption) {
    // 是否收集主应用资源
    if (option?.collectBaseSource) {
      collectBaseSource();
    }
    if (typeof option?.fetchSource === 'function') {
      this.fetchSource = option.fetchSource;
    }
    this.webcomponentTag = option?.webcomponentTag || CUSTOM_ELEMENT_TAG;
    this.setWebComponentTag();
  }
}
const weWeb = new WeWeb();
export default weWeb;
