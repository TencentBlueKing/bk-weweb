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
/* eslint-disable @typescript-eslint/member-ordering */

import { appCache } from '../cache/app-cache';
import { AppState, type ValueOfAppState } from '../common';
import { setCurrentRunningApp } from '../context/cache';
import SandBox from '../context/sandbox';
import { EntrySource } from '../entry/entry';
import { execAppScripts } from '../entry/script';
import {
  type BaseModel,
  type CallbackFunction,
  type ContainerType,
  CSS_ATTRIBUTE_KEY,
  type IAppModelProps,
  WewebMode,
} from '../typings';
import { addUrlProtocol, random } from '../utils/common';

import type { SourceType } from '../utils/load-source';

const IFRAME_CONSTANTS = {
  BLANK_ORIGIN: 'about:blank',
  STYLE_HIDDEN: 'display: none;',
  CHROME_USER_AGENT: 'Chrome',
  DEFAULT_HTML: '<head></head><body></body>',
  POLLING_INTERVAL: 0,
} as const;

const DEFAULT_RANDOM_LENGTH = 5;

/** BK-WEWEB 微应用模式类 */
export class MicroAppModel implements BaseModel {
  private state: ValueOfAppState = AppState.UNSET;

  container?: ContainerType;
  public data: Record<string, unknown>;
  iframe: HTMLIFrameElement | null = null;
  initSource: SourceType;
  isModuleApp = false;
  isPreLoad = false;
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

  constructor(props: IAppModelProps) {
    this.name = props.id !== props.url ? props.id || random(DEFAULT_RANDOM_LENGTH) : random(DEFAULT_RANDOM_LENGTH);
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

    this.initializeSandBox();
    this.setContainerAttribute();
  }

  /** 激活微应用 */
  activated<T = unknown>(container: ContainerType, callback?: CallbackFunction<T>): void {
    this.isPreLoad = false;
    this.state = AppState.ACTIVATED;

    if (container && this.container) {
      this.setContainerAttribute(container);
      this.transferNodes(container);
      this.container = container;
      this.initShadowRootContainer();
      this.sandBox?.activated(this.data);
      callback?.(this);
    }
  }

  /** 创建隔离iframe */
  createIframe(): Promise<HTMLIFrameElement> {
    return new Promise(resolve => {
      const iframe = this.createIframeElement();
      document.body.appendChild(iframe);

      if (this.isChromeUserAgent()) {
        setTimeout(() => resolve(iframe), IFRAME_CONSTANTS.POLLING_INTERVAL);
      } else {
        this.handleNonChromeIframe(iframe, resolve);
      }
    });
  }

  /** 停用微应用 */
  deactivated(): void {
    this.state = AppState.DEACTIVATED;
    this.sandBox?.deactivated();
  }

  /** 初始化ShadowRoot容器 */
  initShadowRootContainer(): void {
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

  /** 挂载微应用 */
  mount<T = unknown>(container?: ContainerType, callback?: CallbackFunction<T>): void {
    this.isPreLoad = false;
    this.container = container ?? this.container;
    this.initShadowRootContainer();
    this.state = AppState.MOUNTING;

    if (this.container) {
      this.setContainerAttribute(this.container);
      this.renderAppContent();
      this.sandBox?.activated(this.data);

      execAppScripts(this).finally(() => {
        this.state = AppState.MOUNTED;
        callback?.(this);
      });
    }
  }

  /** 错误处理 */
  onError(): void {
    this.state = AppState.ERROR;
  }

  /** 挂载处理 */
  onMount(): void {
    if (this.isPreLoad) return;
    this.state = AppState.LOADED;
    this.mount();
  }

  /** 注册运行中的微应用 */
  registerRunningApp(): void {
    setCurrentRunningApp(this);
    Promise.resolve().then(() => setCurrentRunningApp(null));
  }

  /** 启动微应用 */
  async start(): Promise<void> {
    if (!this.source || this.needsReload()) {
      this.state = AppState.LOADING;

      if (this.scopeLocation || this.isModuleApp) {
        const iframe = await this.createIframe();
        this.iframe = iframe;
      }

      this.source = new EntrySource(this.url);
      await this.source.importEntry(this);
    }
  }

  /** 卸载微应用 */
  unmount(needDestroy = false): void {
    this.state = AppState.UNMOUNT;
    this.sandBox?.deactivated();

    if (needDestroy) {
      appCache.deleteApp(this.url);
    }

    if (this.container) {
      this.container.innerHTML = '';
      this.container = undefined;
    }
  }

  get appCacheKey(): string {
    return this.url;
  }

  get status(): ValueOfAppState {
    return this.state;
  }

  set status(value: ValueOfAppState) {
    this.state = value;
  }

  /** 初始化沙盒 */
  private initializeSandBox(): void {
    if (this.scopeJs) {
      this.sandBox = new SandBox(this);
    }
  }

  /** 设置容器属性 */
  private setContainerAttribute(container?: ContainerType): void {
    const targetContainer = container || this.container;
    if (targetContainer instanceof HTMLElement) {
      targetContainer.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
    }
  }

  /** 转移节点到新容器 */
  private transferNodes(container: ContainerType): void {
    if (!this.container) return;

    const fragment = document.createDocumentFragment();
    const nodeList = Array.from(this.container.childNodes);

    for (const node of nodeList) {
      this.setupNodeProperties(node);
      fragment.appendChild(node);
    }

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  /** 设置节点属性 */
  private setupNodeProperties(node: Node): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this;
    const nodeWithProps = node as Node & {
      __KEEP_ALIVE__?: string;
      __BK_WEWEB_APP_KEY__?: string;
      data?: unknown;
    };

    nodeWithProps.__BK_WEWEB_APP_KEY__ = this.appCacheKey;

    // 设置 ownerDocument 属性，这是关键的沙盒功能
    Object.defineProperties(node, {
      ownerDocument: {
        get() {
          return app.sandBox?.rawDocument;
        },
      },
    });
  }

  /** 创建iframe元素 */
  private createIframeElement(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    const url = new URL(addUrlProtocol(this.url));

    iframe.src = this.buildIframeSrc(url);
    iframe.style.cssText = IFRAME_CONSTANTS.STYLE_HIDDEN;

    return iframe;
  }

  /** 构建iframe源地址 */
  private buildIframeSrc(url: URL): string {
    const isChrome = this.isChromeUserAgent();
    return `${isChrome ? IFRAME_CONSTANTS.BLANK_ORIGIN : location.origin}${url.pathname || '/'}${url.search}${url.hash}`;
  }

  /** 检查是否为Chrome浏览器 */
  private isChromeUserAgent(): boolean {
    return navigator.userAgent.includes(IFRAME_CONSTANTS.CHROME_USER_AGENT);
  }

  /** 处理非Chrome浏览器iframe */
  private handleNonChromeIframe(iframe: HTMLIFrameElement, resolve: (iframe: HTMLIFrameElement) => void): void {
    // 其他浏览器在about:blank下会出现同源检测安全错误 换另一种方式来做location保持
    const interval = setInterval(() => {
      if (iframe.contentWindow && iframe.contentWindow.location.href !== IFRAME_CONSTANTS.BLANK_ORIGIN) {
        iframe.contentWindow.stop();
        iframe.contentDocument!.body.parentElement!.innerHTML = IFRAME_CONSTANTS.DEFAULT_HTML;
        clearInterval(interval);
        resolve(iframe);
      }
    }, IFRAME_CONSTANTS.POLLING_INTERVAL);
  }

  /** 渲染应用内容 */
  private renderAppContent(): void {
    if (!this.source) return;

    const clonedNode = this.source.html!.cloneNode(true);
    const fragment = document.createDocumentFragment();

    for (const node of Array.from(clonedNode.childNodes)) {
      this.setupNodeProperties(node);
      fragment.appendChild(node);
    }

    this.container!.innerHTML = '';
    this.container!.appendChild(fragment);
  }

  /** 检查是否需要重新加载 */
  private needsReload(): boolean {
    return this.status === AppState.ERROR || this.status === AppState.UNSET;
  }
}

export const createApp = (props: IAppModelProps): void => {
  appCache.deleteApp(props.url);
  const instance = new MicroAppModel(props);
  appCache.setApp(instance);
};
