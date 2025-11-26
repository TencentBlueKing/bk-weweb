import type { ValueOfAppState } from '../common';
import { WewebCustomAttrs } from '../component/web-component';
import type SandBox from '../context/sandbox';
import type { EntrySource } from '../entry/entry';
import type { fetchSource } from '../utils/fetch';
import type { SourceType } from '../utils/load-source';

/** WEWEB运行模式 */
export enum WewebMode {
  /** 微应用模式 */
  APP = 'app',
  /** 配置模式 */
  CONFIG = 'config',
  /** 微模块模式 */
  INSTANCE = 'js',
}

/** 容器类型 */
export type ContainerType = HTMLElement | ShadowRoot;

/** 通用回调函数类型 */
export type CallbackFunction<T = unknown> = (instance: BaseModel, exportInstance?: T) => void;

/** Web Component 属性接口 */
export interface IComponentProps {
  /** 传递给子应用的数据 */
  [WewebCustomAttrs.data]?: string;
  /** 运行模式 */
  [WewebCustomAttrs.mode]?: WewebMode;
  /** 是否共享主应用路由 */
  [WewebCustomAttrs.scopeLocation]?: boolean;
  /** 是否使用 ShadowDOM */
  [WewebCustomAttrs.setShadowDom]?: boolean;
  /** 是否显示源码 */
  [WewebCustomAttrs.showSourceCode]?: boolean;
  /** 应用URL */
  [WewebCustomAttrs.url]: string;
}

/** 基础模型属性接口 */
export interface IBaseModelProps {
  /** 运行模式 */
  [WewebCustomAttrs.mode]?: WewebMode;
  /** 应用URL */
  [WewebCustomAttrs.url]: string;
  /** 应用ID */
  id?: string | null;
  /** 是否预加载 */
  isPreLoad?: boolean;
  /** 获取资源的函数 */
  fetchSource?: typeof fetchSource;
}

/** 微应用模式属性配置 */
export interface IAppModelProps extends IBaseModelProps {
  /** 传递给子应用的数据 */
  [WewebCustomAttrs.data]?: Record<string, unknown>;
  /** 是否缓存DOM */
  [WewebCustomAttrs.keepAlive]?: boolean;
  /** 是否启用样式隔离 */
  [WewebCustomAttrs.scopeCss]?: boolean;
  /** 是否使用沙盒隔离 */
  [WewebCustomAttrs.scopeJs]?: boolean;
  /** 是否共享主应用路由 */
  [WewebCustomAttrs.scopeLocation]?: boolean;
  /** 是否使用 ShadowDOM */
  [WewebCustomAttrs.setShadowDom]?: boolean;
  /** 是否显示源码 */
  [WewebCustomAttrs.showSourceCode]?: boolean;
  /** 容器元素 */
  container?: ContainerType | null;
  /** 初始化资源 */
  initSource?: SourceType;
}

/** 微模块模式属性配置 */
export interface IJsModelProps extends IBaseModelProps {
  /** 传递给模块的数据 */
  [WewebCustomAttrs.data]?: Record<string, unknown>;
  /** 是否显示源码 */
  [WewebCustomAttrs.showSourceCode]?: boolean;
  /** 容器元素 */
  container?: ContainerType | null;
  /** 初始化资源 */
  initSource?: SourceType;
  /** 是否缓存DOM */
  keepAlive?: boolean;
  /** 是否启用样式隔离 */
  scopeCss?: boolean;
  /** 是否使用沙盒隔离 */
  scopeJs?: boolean;
}

/** 基础模型接口 */
export interface BaseModel {
  /** 应用缓存键 */
  readonly appCacheKey: string;
  /** 容器元素 */
  container?: ContainerType;
  /** 初始化资源 */
  initSource?: SourceType;
  /** 是否为模块应用 */
  isModuleApp?: boolean;
  /** 是否预加载 */
  isPreLoad: boolean;
  /** 是否保持活跃 */
  keepAlive?: boolean;
  /** 应用名称 */
  name: string;
  /** 沙盒实例 */
  sandBox?: SandBox;
  /** 是否启用样式隔离 */
  scopeCss?: boolean;
  /** 是否使用JS隔离 */
  scopeJs: boolean;
  /** 是否显示源码 */
  showSourceCode?: boolean;
  /** 入口资源 */
  source?: EntrySource;
  /** 应用URL */
  url: string;
  /** 获取资源的函数 */
  fetchSource?: typeof fetchSource;
  /** 传递给应用的数据 */
  data: Record<string, unknown>;

  /** 激活应用 */
  activated<T = unknown>(container: ContainerType, callback?: CallbackFunction<T>): void;
  /** 停用应用 */
  deactivated(): void;
  /** 挂载应用 */
  mount<T = unknown>(container?: ContainerType, callback?: CallbackFunction<T>): void;
  /** 错误处理 */
  onError(): void;
  /** 挂载处理 */
  onMount(): void;
  /** 注册运行中的应用 */
  registerRunningApp(): void;
  /** 启动应用 */
  start(): Promise<void>;
  /** 卸载应用 */
  unmount(needDestroy?: boolean): void;
  /** 获取应用状态 */
  get status(): ValueOfAppState;
  /** 设置应用状态 */
  set status(value: ValueOfAppState);
}
