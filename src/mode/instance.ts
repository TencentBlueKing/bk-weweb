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
import { excuteAppStyles } from '../entry/style';
import { BaseModel, CSS_ATTRIBUTE_KEY, IJsModelProps } from '../typings';
import { random } from '../utils/common';
import { SourceType } from '../utils/load-source';
// bk-kweweb 微模块模式
export class MicroInstanceModel implements BaseModel {
  private state: AppState = AppState.UNSET; // 当前实例状态
  appCacheKey: string; // 缓存key
  container?: HTMLElement | ShadowRoot; // 容器
  data: Record<string, unknown>; // 数据
  initSource: SourceType; // 初始资源
  isPreLoad = false; // 是否预加载
  keepAlive: boolean; // 是否缓存
  name: string; // 名称
  sandBox?: SandBox; // 沙箱
  scopeCss = true; // 是否隔离样式
  scopeJs = false; // 是否隔离js
  showSourceCode = true; // 是否显示源码
  source?: EntrySource; // 入口资源
  url: string; // url
  constructor(props: IJsModelProps) {
    this.name = props.id !== props.url ? props.id! : random(5);
    this.appCacheKey = props.id || this.name;
    this.url = props.url;
    this.container = props.container ?? undefined;
    this.scopeJs = props.scopeJs ?? true;
    this.showSourceCode = props.showSourceCode ?? true;
    this.scopeCss = props.scopeCss ?? true;
    this.keepAlive = props.keepAlive ?? false;
    this.data = props.data ?? {};
    this.initSource = props.initSource ?? [];
    // 是否启用沙盒
    if (this.scopeJs) {
      this.sandBox = new SandBox(this);
    }
  }
  activated<T>(
    container: HTMLElement | ShadowRoot,
    callback?: (instance: BaseModel, exportInstance?: T) => void,
  ): void {
    this.isPreLoad = false;
    this.state = AppState.ACTIVATED;
    if (this.container && container) {
      if (container instanceof Element) container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
      const fragment = document.createDocumentFragment();
      Array.from(this.container.childNodes).forEach((node: Element | Node) => {
        fragment.appendChild(node);
      });
      container.appendChild(fragment);
      this.container = container;
      this.sandBox?.activeated();
      const scriptInfo = this.source?.getScript(this.url);
      callback?.(this, scriptInfo?.exportInstance);
    }
  }
  deactivated(): void {
    this.state = AppState.DEACTIVATED;
    this.sandBox?.deactivated();
  }
  mount<T>(
    container?: HTMLElement | ShadowRoot,
    callback?: (instance: MicroInstanceModel, exportInstance: T) => void,
  ): void {
    this.isPreLoad = false;
    this.container = container ?? this.container!;
    this.state = AppState.MOUNTING;
    if (this.container instanceof HTMLElement) {
      this.container!.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
    }
    this.container.innerHTML = '';
    const instanceWrap = document.createElement('div');
    const wrapId = `${this.name}-wrapper`;
    instanceWrap.setAttribute('id', wrapId);
    if (this.source?.styles.size) {
      excuteAppStyles(this, this.container);
    }
    this.container.appendChild(instanceWrap);
    this.sandBox?.activeated();
    execAppScripts(this).finally(() => {
      this.state = AppState.MOUNTED;
      const scriptInfo = this.source?.getScript(this.url);
      if (typeof scriptInfo?.exportInstance?.render === 'function') {
        scriptInfo.exportInstance.render(instanceWrap, this.data);
      }
      callback?.(this, scriptInfo?.exportInstance);
    });
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
  async start(): Promise<void> {
    if (!this.source || [AppState.ERROR, AppState.UNSET].includes(this.status)) {
      this.source = new EntrySource(this.url);
      await this.source.importEntery(this);
    }
  }
  unmount(needDestroy?: boolean): void {
    this.state = AppState.UNMOUNT;
    this.sandBox?.deactivated();
    needDestroy && appCache.deleteApp(this.url);
    this.container!.innerHTML = '';
    this.container = undefined;
  }
  set status(v: AppState) {
    this.state = v;
  }
  get status(): AppState {
    return this.state;
  }
}
