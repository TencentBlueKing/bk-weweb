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
import { BaseModel, CSS_ATTRIBUTE_KEY, IAppModleProps, WewebMode } from '../typings';
import { addUrlProtocol, random } from '../utils/common';
import { SourceType } from '../utils/load-source';

const BLANK_ORIGN = 'about:blank';
export class MicroAppModel implements BaseModel {
  private state: AppState = AppState.UNSET;
  container?: HTMLElement | ShadowRoot;
  public data: Record<string, unknown>;
  iframe: HTMLIFrameElement | null = null;
  initSource: SourceType;
  public isPreLoad = false;
  keepAlive: boolean;
  mode: WewebMode = WewebMode.APP;
  name: string;
  sandBox?: SandBox;
  scopeCss: boolean;
  scopeJs: boolean;
  scopeLocation: boolean;
  showSourceCode: boolean;
  source?: EntrySource;
  url: string;
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
  activated(container: HTMLElement | ShadowRoot, callback?: (app: BaseModel) => void) {
    this.isPreLoad = false;
    this.state = AppState.ACTIVATED;
    if (container && this.container) {
      if (container instanceof Element) container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
      const fragment = document.createDocumentFragment();
      Array.from(this.container.childNodes).forEach((node: Element | Node) => {
        fragment.appendChild(node);
      });
      container.innerHTML = '';
      container.appendChild(fragment);
      this.container = container;
      this.sandBox?.activeated(this.data);
      callback?.(this);
    }
  }
  get appCacheKey(): string {
    return this.url;
  }
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
  mount(container?: HTMLElement | ShadowRoot, callback?: (app: BaseModel) => void): void {
    this.isPreLoad = false;
    this.container = container ?? this.container!;
    this.state = AppState.MOUNTING;
    if (this.container) {
      if (this.container instanceof Element) this.container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
      const clonedNode = this.source!.html!.cloneNode(true);
      const fragment = document.createDocumentFragment();
      Array.from(clonedNode.childNodes).forEach((node: Element | Node) => {
        fragment.appendChild(node);
      });
      this.container.innerHTML = '';
      this.container.appendChild(fragment);
      this.sandBox?.activeated(this.data);
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
      if (this.scopeLocation) {
        const iframe = await this.createIframe();
        this.iframe = iframe;
      }
      this.source = new EntrySource(this.url);
      await this.source.importEntery(this);
    }
  }
  public get status() {
    return this.state;
  }
  public set status(v: AppState) {
    this.state = v;
  }
  unmount(needDestroy = false): void {
    this.state = AppState.UNMOUNT;
    this.sandBox?.deactivated();
    needDestroy && appCache.deleteApp(this.url);
    this.container!.innerHTML = '';
    this.container = undefined;
  }
}
export const createApp = (props: IAppModleProps) => {
  appCache.deleteApp(props.url);
  const instance = new MicroAppModel(props);
  appCache.setApp(instance);
};
