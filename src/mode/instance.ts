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
import { AppState, type ValueOfAppState } from '../common';
import { setCurrentRunningApp } from '../context/cache';
import SandBox from '../context/sandbox';
import { EntrySource } from '../entry/entry';
import { execAppScripts } from '../entry/script';
import { executeAppStyles } from '../entry/style';
import { CSS_ATTRIBUTE_KEY } from '../typings';
import { random } from '../utils/common';

import type { BaseModel, CallbackFunction, ContainerType, IJsModelProps } from '../typings';
import type { fetchSource } from '../utils/fetch';
import type { SourceType } from '../utils/load-source';

const DEFAULT_RANDOM_LENGTH = 5;
const WRAPPER_SUFFIX = '-wrapper';

interface RenderableInstance {
  render?: (container: HTMLElement, data: Record<string, unknown>) => void;
}

interface ScriptInstanceInfo {
  exportInstance?: RenderableInstance & Record<string, unknown>;
}

/** BK-WEWEB 微模块模式类 */
export class MicroInstanceModel implements BaseModel {
  private state: ValueOfAppState = AppState.UNSET;

  appCacheKey: string;
  container?: ContainerType;
  data: Record<string, unknown>;
  fetchSource?: typeof fetchSource;
  initSource: SourceType;
  isPreLoad = false;
  keepAlive: boolean;
  name: string;
  sandBox?: SandBox;
  scopeCss = true;
  scopeJs = false;
  showSourceCode = true;
  source?: EntrySource;
  url: string;

  constructor(props: IJsModelProps & { fetchSource?: typeof fetchSource }) {
    this.name = props.id !== props.url ? props.id! : random(DEFAULT_RANDOM_LENGTH);
    this.appCacheKey = props.id || this.name;
    this.url = props.url;
    this.container = props.container ?? undefined;
    this.scopeJs = props.scopeJs ?? true;
    this.showSourceCode = props.showSourceCode ?? true;
    this.scopeCss = props.scopeCss ?? true;
    this.keepAlive = props.keepAlive ?? false;
    this.data = props.data ?? {};
    this.initSource = props.initSource ?? [];
    this.fetchSource = props.fetchSource;

    this.initializeSandBox();
  }

  /** 激活微模块 */
  activated<T = unknown>(container: ContainerType, callback?: CallbackFunction<T>): void {
    this.isPreLoad = false;
    this.state = AppState.ACTIVATED;

    if (this.container && container) {
      this.setContainerAttribute(container);
      this.transferNodes(container);
      this.container = container;
      this.sandBox?.activated();

      const scriptInfo = this.getScriptInfo();
      callback?.(this, scriptInfo?.exportInstance as T);
    }
  }

  /** 停用微模块 */
  deactivated(): void {
    this.state = AppState.DEACTIVATED;
    this.sandBox?.deactivated();
  }

  /** 挂载微模块 */
  mount<T = unknown>(container?: ContainerType, callback?: CallbackFunction<T>): void {
    this.isPreLoad = false;
    this.container = container ?? this.container!;
    this.state = AppState.MOUNTING;

    this.setContainerAttribute(this.container);
    this.setupContainer();
    this.executeStyles();
    this.sandBox?.activated();

    execAppScripts(this).finally(() => {
      this.state = AppState.MOUNTED;
      this.renderInstance();

      const scriptInfo = this.getScriptInfo();
      callback?.(this, scriptInfo?.exportInstance as T);
    });
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

  /** 注册运行中的应用 */
  registerRunningApp(): void {
    setCurrentRunningApp(this);
    Promise.resolve().then(() => setCurrentRunningApp(null));
  }

  /** 启动微模块 */
  async start(): Promise<void> {
    if (!this.source || this.needsReload()) {
      this.source = new EntrySource(this.url);
      await this.source.importEntry(this);
    }
  }

  /** 卸载微模块 */
  unmount(needDestroy?: boolean): void {
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

  set status(value: ValueOfAppState) {
    this.state = value;
  }

  get status(): ValueOfAppState {
    return this.state;
  }

  /** 初始化沙盒 */
  private initializeSandBox(): void {
    if (this.scopeJs) {
      this.sandBox = new SandBox(this);
    }
  }

  /** 设置容器属性 */
  private setContainerAttribute(container: ContainerType): void {
    if (container instanceof HTMLElement) {
      container.setAttribute(CSS_ATTRIBUTE_KEY, this.name);
    }
  }

  /** 转移节点到新容器 */
  private transferNodes(container: ContainerType): void {
    if (!this.container) return;

    const fragment = document.createDocumentFragment();
    const nodeList = Array.from(this.container.childNodes);

    for (const node of nodeList) {
      fragment.appendChild(node);
    }

    container.appendChild(fragment);
  }

  /** 设置容器 */
  private setupContainer(): void {
    if (this.container) {
      this.container.innerHTML = '';
      const instanceWrapper = this.createInstanceWrapper();
      this.container.appendChild(instanceWrapper);
    }
  }

  /** 执行样式 */
  private executeStyles(): void {
    if (this.source?.styles.size && this.container) {
      executeAppStyles(this, this.container);
    }
  }

  /** 创建实例包装器 */
  private createInstanceWrapper(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.id = `${this.name}${WRAPPER_SUFFIX}`;
    return wrapper;
  }

  /** 渲染实例 */
  private renderInstance(): void {
    const scriptInfo = this.getScriptInfo();
    if (scriptInfo?.exportInstance?.render && this.container) {
      const targetContainer = this.container.querySelector(`#${this.name}${WRAPPER_SUFFIX}`) as HTMLElement;

      if (targetContainer) {
        scriptInfo.exportInstance.render(targetContainer, this.data);
      }
    }
  }

  /** 获取脚本信息 */
  private getScriptInfo(): ScriptInstanceInfo | undefined {
    const script = this.source?.getScript(this.url);
    return script
      ? { exportInstance: script.exportInstance as RenderableInstance & Record<string, unknown> }
      : undefined;
  }

  /** 检查是否需要重新加载 */
  private needsReload(): boolean {
    return this.status === AppState.ERROR || this.status === AppState.UNSET;
  }
}

export const createInstance = (props: IJsModelProps): void => {
  const instance = new MicroInstanceModel(props);
  appCache.setApp(instance);
  instance.start().finally(() => instance.onMount());
};
