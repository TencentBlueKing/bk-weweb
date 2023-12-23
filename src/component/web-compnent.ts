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
import { appCache } from '../cache/app-cache';
import { AppState } from '../common';
import { activated } from '../lifecircle/activated';
import { deactivated } from '../lifecircle/deactivated';
import { load } from '../lifecircle/load';
import { unmount } from '../lifecircle/unmount';
import { IAppModleProps, IJsModelProps, WewebMode } from '../typings';
// bk-weweb支持的属性配置
export enum WewebCustomAttrs {
  data = 'data', // 传递给子应用的数据
  id = 'id', // 应用id
  keepAlive = 'keepAlive', // 是否缓存
  mode = 'mode', // 模式
  scopeCss = 'scopeCss', // 是否开启css隔离
  scopeJs = 'scopeJs', // 是否开启js隔离
  scopeLocation = 'scopeLocation', // 是否开启location隔离
  setShodowDom = 'setShodowDom', // 是否开启shadowDom
  showSourceCode = 'showSourceCode', // 是否显示源码
  url = 'url',
}
export default class BkWewebElement extends HTMLElement {
  private appUrl = '';
  private connected = false;
  static get observedAttributes(): string[] {
    return [WewebCustomAttrs.url];
  }
  private getBooleanAttr(name: string): boolean | undefined {
    return this.hasAttribute(name) ? this.getAttribute(name) !== 'false' : undefined;
  }
  private async handleAttributeChanged(): Promise<void> {
    if (!this.appKey) return;
    if (this.getBooleanAttr(WewebCustomAttrs.setShodowDom)) {
      this.attachShadow({ mode: 'open' });
    }
    const app = appCache.getApp(this.appKey!);
    if (app && app.url === this.appUrl && (app.isPreLoad || app.status === AppState.UNMOUNT)) {
      activated(this.appKey!, this.shadowRoot ?? this);
      return;
    }
    await load(this.appProps);
  }
  attributeChangedCallback(attr: WewebCustomAttrs, _oldVal: string, newVal: string): void {
    if (attr !== WewebCustomAttrs.url || (this as any)[attr] === newVal || !this.connected) return;
    this.appUrl = newVal;
    const cacheApp = appCache.getApp(this.appKey!);
    (this.connected || cacheApp) && this.handleAttributeChanged();
  }
  async connectedCallback(): Promise<void> {
    if (this.getBooleanAttr(WewebCustomAttrs.setShodowDom) && !this.shadowRoot) {
      this.attachShadow({ delegatesFocus: false, mode: 'open' });
    }
    await load(this.appProps);
    activated(this.appKey!, this.shadowRoot ?? this);
    this.connected = true;
  }
  disconnectedCallback(): void {
    this.connected = false;
    if (this.appProps.keepAlive) {
      deactivated(this.appKey!);
    } else unmount(this.appKey!);
  }
  get appData(): Record<string, unknown> {
    if (this.hasAttribute(WewebCustomAttrs.data)) {
      try {
        return JSON.parse(this.getAttribute(WewebCustomAttrs.data)!);
      } catch {}
    }
    return {};
  }
  // 考虑到js模式下 需要js bundle的复用性 需用户设置id属性 如果单实例下则可以不用配置
  get appKey(): null | string {
    return this.getAttribute(WewebCustomAttrs.id) || this.getAttribute(WewebCustomAttrs.url);
  }
  get appProps(): IAppModleProps | IJsModelProps {
    if (this.getAttribute('mode') === WewebMode.INSTANCE) {
      return {
        container: this.shadowRoot ?? this,
        data: this.appData,
        id: this.appKey!,
        keepAlive: this.getBooleanAttr(WewebCustomAttrs.keepAlive),
        mode: WewebMode.INSTANCE,
        scopeCss: this.getBooleanAttr(WewebCustomAttrs.scopeCss) && !this.getBooleanAttr(WewebCustomAttrs.setShodowDom),
        scopeJs: this.getBooleanAttr(WewebCustomAttrs.scopeJs),
        showSourceCode: this.getBooleanAttr(WewebCustomAttrs.showSourceCode),
        url: this.getAttribute(WewebCustomAttrs.url)!,
      };
    }
    return {
      container: this.shadowRoot ?? this,
      data: this.appData,
      id: this.appKey!,
      keepAlive: this.getBooleanAttr(WewebCustomAttrs.keepAlive),
      mode: WewebMode.APP,
      scopeCss: !this.getBooleanAttr(WewebCustomAttrs.setShodowDom),
      scopeJs: !this.getBooleanAttr(WewebCustomAttrs.scopeJs),
      scopeLocation: this.getBooleanAttr(WewebCustomAttrs.scopeLocation),
      showSourceCode: this.getBooleanAttr(WewebCustomAttrs.showSourceCode),
      url: this.getAttribute(WewebCustomAttrs.url)!,
    };
  }
}
