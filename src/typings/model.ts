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
import type { AppState } from '../common';
import { WewebCustomAttrs } from '../component/web-compnent';
import type SandBox from '../context/sandbox';
import type { EntrySource } from '../entry/entry';
import type { SourceType } from '../utils/load-source';

export interface IComponentProps {
  // 传递给子应用的数据 默认保存
  [WewebCustomAttrs.data]?: string;
  // entry mode js | config | html 默认 html
  [WewebCustomAttrs.mode]?: WewebMode;
  // 是否共享主应用路由
  [WewebCustomAttrs.scopeLocation]?: boolean;
  // 是否使用shadowDom
  [WewebCustomAttrs.setShodowDom]?: boolean;
  // 是否在dom上显示源码 默认不显示 内存执行
  [WewebCustomAttrs.showSourceCode]?: boolean;
  // url 必选
  [WewebCustomAttrs.url]: string;
}

// 基础属性接口
export interface IBaseModelProps {
  // entry mode js | config | html 默认 html
  [WewebCustomAttrs.mode]?: WewebMode;
  // url 必选
  [WewebCustomAttrs.url]: string;
  id?: null | string;
  // 是否是预加载
  isPreLoad?: boolean;
}

// app模式属性配置
export interface IAppModleProps extends IBaseModelProps {
  // 传递给子应用的数据 默认保存
  [WewebCustomAttrs.data]?: Record<string, unknown>;
  // 是否缓存dom
  [WewebCustomAttrs.keepAlive]?: boolean;
  // 是否启用样式隔离 默认隔离
  [WewebCustomAttrs.scopeCss]?: boolean;
  // 是否使用沙盒隔离 默认隔离
  [WewebCustomAttrs.scopeJs]?: boolean;
  // 是否共享主应用路由
  [WewebCustomAttrs.scopeLocation]?: boolean;
  // 是否使用shadowDom
  [WewebCustomAttrs.setShodowDom]?: boolean;
  // 是否在dom上显示源码 默认不显示 内存执行
  [WewebCustomAttrs.showSourceCode]?: boolean;
  container?: HTMLElement | ShadowRoot | null;
  // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
  initSource?: SourceType;
}

export interface IJsModelProps extends IBaseModelProps {
  // 传递给实例render方法的数据
  [WewebCustomAttrs.data]?: Record<string, unknown>;
  // 是否在dom上显示源码 默认显示
  [WewebCustomAttrs.showSourceCode]?: boolean;
  // 容器
  container?: HTMLElement | ShadowRoot | null;
  // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
  initSource?: SourceType;
  // 是否缓存dom
  keepAlive?: boolean;
  // 是否启用样式隔离 默认隔离
  scopeCss?: boolean;
  // 是否使用沙盒隔离 默认不隔离
  scopeJs?: boolean;
}

export interface BaseModel {
  activated<T>(container: HTMLElement | ShadowRoot, callback?: (instance: BaseModel, exportInstance?: T) => void): void;
  container?: HTMLElement | ShadowRoot;
  deactivated(): void;
  get appCacheKey(): string;
  get status(): AppState;
  // eslint-disable-next-line perfectionist/sort-interfaces
  initSource?: SourceType;
  isModuleApp?: boolean;
  // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
  isPreLoad: boolean;
  keepAlive?: boolean;
  mount<T>(container?: HTMLElement | ShadowRoot, callback?: (instance: BaseModel, exportInstance?: T) => void): void;
  name: string;
  onError(): void;
  onMount(): void;
  registerRunningApp(): void;
  sandBox?: SandBox;
  // 是否启用样式隔离 默认隔离
  scopeCss?: boolean;
  scopeJs: boolean;
  set status(v: AppState);
  showSourceCode?: boolean;
  source?: EntrySource;
  start(): Promise<void>;
  unmount(needDestroy?: boolean): void;
  url: string;
}

export enum WewebMode {
  APP = 'app',
  CONFIG = 'config',
  INSTANCE = 'js',
}
