/* eslint-disable @typescript-eslint/member-ordering */
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
import { setCurrentRunningApp } from '../context/cache';
import SandBox from '../context/sandbox';
import { EntrySource } from '../entry/entry';
import { execAppScripts } from '../entry/script';
import { type BaseModel, CSS_ATTRIBUTE_KEY, type IAppModleProps, WewebMode } from '../typings';
import { addUrlProtocol, random } from '../utils/common';

import type { SourceType } from '../utils/load-source';

const BLANK_ORIGN = 'about:blank';
// bk-weweb 微应用模式
export class MicroAppModel implements BaseModel {
  private state: AppState = AppState.UNSET; // 状态
  container?: HTMLElement | ShadowRoot; // 容器
  public data: Record<string, unknown>; // 数据
  iframe: HTMLIFrameElement | null = null; // scoped iframe
  initSource: SourceType; // 初始资源
  isModuleApp = false; // 是否预加载
  public isPreLoad = false; // 是否缓存
  keepAlive: boolean;
  mode: WewebMode = WewebMode.APP; // 名称
  name: string; // 沙箱
  sandBox?: SandBox; // 是否隔离样式
  scopeCss: boolean; // 是否隔离js
  scopeJs: boolean; // 是否隔离location
  scopeLocation: boolean; // 是否显示源码
  showSourceCode: boolean; // 入口资源
  source?: EntrySource; // url
  url: string; // 是否是esm应用
  constructor(props: IAppModleProps) {
    this.name = props.id !== props.url ? props.id! : random(5);
    this.mode = props.mode ?? WewebMode.APP;
    this.container = props.container ?? undefined;
    this.showSourceCode = props.showSourceCode ?? false;
    this.url = props.url;
    this.data = props.data || {};
    this.scopeJs = props.scopeJs ?? true;
    this.scopeCss = props.scopeCss ?? true;
    this.scopeLocation = props.scopeLocation ?? false;
    this.isPreLoad = props.isPreLoad ?? false;
    this.keepAlive = props.keepAlive ?? false;
    this.initSource = props.initSource ?? [];
    if (this.scopeJs) {
      this.sandBox = new SandBox(this);
    }
    if (this.container instanceof HTMLElement) {
      this.container.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
    }
  }
  // 激活
  activated(container: HTMLElement | ShadowRoot, callback?: (app: BaseModel) => void) {
    this.isPreLoad = false;
    this.state = AppState.ACTIVATED;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this;
    if (container && this.container) {
      if (container instanceof Element) container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
      const fragment = document.createDocumentFragment();
      const list = Array.from(this.container.childNodes);
      for (const node of list) {
        node.__BK_WEWEB_APP_KEY__ = this.appCacheKey;
        Object.defineProperties(node, {
          ownerDocument: {
            get() {
              return app.sandBox?.rawDocument;
            },
          },
        });
        fragment.appendChild(node);
      }
      container.innerHTML = '';
      container.appendChild(fragment);
      this.container = container;
      this.initShadowRootContainer();
      this.sandBox?.activated(this.data);
      callback?.(this);
    }
  }
  // 创建隔离iframe
  createIframe(): Promise<HTMLIFrameElement> {
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      const url = new URL(addUrlProtocol(this.url));
      const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
      iframe.setAttribute(
        'src',
        `${isChrome ? BLANK_ORIGN : location.origin}${url.pathname || '/'}${url.search}${url.hash}`,
      );
      iframe.style.cssText = 'display: none;';
      document.body.appendChild(iframe);
      if (isChrome) {
        setTimeout(() => resolve(iframe), 0);
      } else {
        // 其他浏览器在about:blank下会出现同源检测安全错误 换另一种方式来做location保持
        const interval = setInterval(() => {
          if (iframe.contentWindow && iframe.contentWindow.location.href !== BLANK_ORIGN) {
            iframe.contentWindow!.stop();
            iframe.contentDocument!.body.parentElement!.innerHTML = '<head></head><body></body>';
            clearInterval(interval);
            resolve(iframe);
          }
        }, 0);
      }
    });
  }
  deactivated() {
    this.state = AppState.DEACTIVATED;
    this.sandBox?.deactivated();
  }
  initShadowRootContainer() {
    if (this.container instanceof ShadowRoot) {
      // inject echarts in shadowRoot
      Object.defineProperties(this.container, {
        getBoundingClientRect: {
          get() {
            return this.host.getBoundingClientRect;
          },
        },
      });
    }
  }
  mount(container?: HTMLElement | ShadowRoot, callback?: (app: BaseModel) => void): void {
    this.isPreLoad = false;
    this.container = container ?? this.container!;
    this.initShadowRootContainer();
    this.state = AppState.MOUNTING;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this;
    if (this.container) {
      if (this.container instanceof Element) this.container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
      const clonedNode = this.source!.html!.cloneNode(true);
      const fragment = document.createDocumentFragment();
      for (const node of Array.from(clonedNode.childNodes)) {
        node.__BK_WEWEB_APP_KEY__ = this.appCacheKey;
        Object.defineProperties(node, {
          ownerDocument: {
            get() {
              return app.sandBox?.rawDocument;
            },
          },
        });
        fragment.appendChild(node);
      }
      this.container.innerHTML = '';
      this.container.appendChild(fragment);
      this.sandBox?.activated(this.data);
      execAppScripts(this).finally(() => {
        this.state = AppState.MOUNTED;
        callback?.(this);
      });
    }
  }
  onError(): void {
    this.state = AppState.ERROR;
  }
  onMount(): void {
    if (this.isPreLoad) return;
    this.state = AppState.LOADED;
    this.mount();
  }
  registerRunningApp() {
    setCurrentRunningApp(this);
    Promise.resolve().then(() => setCurrentRunningApp(null));
  }
  async start() {
    if (!this.source || [AppState.ERROR, AppState.UNSET].includes(this.status)) {
      this.state = AppState.LOADING;
      if (this.scopeLocation || this.isModuleApp) {
        const iframe = await this.createIframe();
        this.iframe = iframe;
      }
      this.source = new EntrySource(this.url);
      await this.source.importEntry(this);
    }
  }
  unmount(needDestroy = false): void {
    this.state = AppState.UNMOUNT;
    this.sandBox?.deactivated();
    needDestroy && appCache.deleteApp(this.url);
    this.container!.innerHTML = '';
    this.container = undefined;
  }
  get appCacheKey(): string {
    return this.url;
  }
  public get status() {
    return this.state;
  }
  public set status(v: AppState) {
    this.state = v;
  }
}
export const createApp = (props: IAppModleProps) => {
  appCache.deleteApp(props.url);
  const instance = new MicroAppModel(props);
  appCache.setApp(instance);
};
