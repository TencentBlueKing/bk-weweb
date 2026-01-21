# 类型定义

本文档提供 BK-WeWeb 的完整 TypeScript 类型定义参考。

## 枚举类型

### WewebMode

运行模式枚举。

```typescript
enum WewebMode {
  /** 微应用模式 - 加载完整 HTML 应用 */
  APP = 'app',

  /** 微模块模式 - 加载 JS 模块 */
  INSTANCE = 'js',

  /** 配置模式 - 保留 */
  CONFIG = 'config',
}
```

### AppState

应用状态常量。

```typescript
const AppState = {
  /** 未设置 */
  UNSET: 1,

  /** 加载中 */
  LOADING: 2,

  /** 已加载 */
  LOADED: 3,

  /** 挂载中 */
  MOUNTING: 4,

  /** 已挂载 */
  MOUNTED: 5,

  /** 已激活（keepAlive 模式） */
  ACTIVATED: 6,

  /** 已停用（keepAlive 模式） */
  DEACTIVATED: 7,

  /** 已卸载 */
  UNMOUNT: 8,

  /** 错误状态 */
  ERROR: 9,
} as const;

type ValueOfAppState = (typeof AppState)[keyof typeof AppState];
```

## 接口类型

### IStartOption

WeWeb 启动配置。

```typescript
interface IStartOption {
  /**
   * 是否收集基础资源
   * @description 开启后会收集主应用已加载的脚本和样式，供子应用共享
   * @default false
   */
  collectBaseSource?: boolean;

  /**
   * 自定义资源获取函数
   * @description 用于自定义 HTTP 请求逻辑，如添加认证头、请求代理等
   * @param url - 资源 URL
   * @param options - fetch 选项
   * @returns 资源内容
   */
  fetchSource?: FetchSourceType;

  /**
   * 自定义 Web Component 标签名
   * @description 必须包含连字符，符合 Web Components 规范
   * @default 'bk-weweb'
   */
  webComponentTag?: string;
}
```

### IBaseModelProps

基础模型属性接口。

```typescript
interface IBaseModelProps {
  /**
   * 入口 URL
   * @description 微应用的 HTML 入口或微模块的 JS 文件地址
   * @required
   */
  url: string;

  /**
   * 应用/模块唯一标识符
   * @description 用于缓存复用和生命周期管理
   */
  id?: string | null;

  /**
   * 运行模式
   * @default WewebMode.APP
   */
  mode?: WewebMode;

  /**
   * 是否预加载
   * @description 预加载模式不会立即渲染
   * @default false
   */
  isPreLoad?: boolean;

  /**
   * 自定义资源获取函数
   * @description 优先级高于全局配置
   */
  fetchSource?: FetchSourceType;
}
```

### IAppModelProps

微应用模型属性接口。

```typescript
interface IAppModelProps extends IBaseModelProps {
  /**
   * 挂载容器
   * @description 可以是普通元素或 Shadow Root
   */
  container?: ContainerType | null;

  /**
   * 是否启用 JS 沙箱隔离
   * @description 开启后子应用的 JS 在隔离环境中执行
   * @default true
   */
  scopeJs?: boolean;

  /**
   * 是否启用 CSS 样式隔离
   * @description 开启后子应用的 CSS 选择器会添加作用域前缀
   * @default true
   */
  scopeCss?: boolean;

  /**
   * 是否启用路由隔离
   * @description 开启后子应用拥有独立的 location 和 history
   * @default false
   */
  scopeLocation?: boolean;

  /**
   * 是否使用 Shadow DOM 渲染
   * @description 开启后获得更彻底的 DOM 和样式隔离
   * @default false
   */
  setShadowDom?: boolean;

  /**
   * 是否启用缓存模式
   * @description 开启后应用切换时保留 DOM 状态
   * @default false
   */
  keepAlive?: boolean;

  /**
   * 是否在 DOM 中显示源码
   * @description 开启后脚本以 <script> 标签形式插入
   * @default false
   */
  showSourceCode?: boolean;

  /**
   * 传递给子应用的数据
   * @description 子应用通过 window.__BK_WEWEB_DATA__ 访问
   */
  data?: Record<string, unknown>;

  /**
   * 初始化资源列表
   * @description 子应用加载前预先加载的资源
   */
  initSource?: SourceType;
}
```

### IJsModelProps

微模块模型属性接口。

```typescript
interface IJsModelProps extends IBaseModelProps {
  /**
   * 挂载容器
   */
  container?: ContainerType | null;

  /**
   * 是否启用 JS 沙箱隔离
   * @default false
   */
  scopeJs?: boolean;

  /**
   * 是否启用 CSS 样式隔离
   * @default true
   */
  scopeCss?: boolean;

  /**
   * 是否启用缓存模式
   * @default false
   */
  keepAlive?: boolean;

  /**
   * 是否在 DOM 中显示源码
   * @default true
   */
  showSourceCode?: boolean;

  /**
   * 传递给模块的数据
   */
  data?: Record<string, unknown>;

  /**
   * 初始化资源列表
   */
  initSource?: SourceType;
}
```

### IComponentProps

Web Component 属性接口。

```typescript
interface IComponentProps {
  /**
   * 入口 URL
   */
  url: string;

  /**
   * 应用/模块标识符
   */
  id: string | null;

  /**
   * 运行模式
   */
  mode: WewebMode;

  /**
   * 是否启用 JS 沙箱隔离
   */
  scopeJs: boolean;

  /**
   * 是否启用 CSS 样式隔离
   */
  scopeCss: boolean;

  /**
   * 是否启用路由隔离
   */
  scopeLocation: boolean;

  /**
   * 是否使用 Shadow DOM
   */
  setShadowDom: boolean;

  /**
   * 是否显示源码
   */
  showSourceCode: boolean;

  /**
   * 是否启用缓存模式
   */
  keepAlive: boolean;

  /**
   * 传递数据
   */
  data?: Record<string, unknown>;
}
```

### BaseModel

基础模型类接口。

```typescript
interface BaseModel {
  /** 缓存键 */
  readonly appCacheKey: string;

  /** 挂载容器 */
  container?: ContainerType;

  /** 应用名称 */
  name: string;

  /** 入口 URL */
  url: string;

  /** 传递的数据 */
  data: Record<string, unknown>;

  /** 是否预加载 */
  isPreLoad: boolean;

  /** 是否缓存模式 */
  keepAlive?: boolean;

  /** 是否 JS 隔离 */
  scopeJs: boolean;

  /** 是否 CSS 隔离 */
  scopeCss?: boolean;

  /** 是否显示源码 */
  showSourceCode?: boolean;

  /** 资源实例 */
  source?: EntrySource;

  /** 沙箱实例 */
  sandBox?: SandBox;

  /** 激活应用 */
  activated<T>(container: ContainerType, callback?: CallbackFunction<T>): void;

  /** 停用应用 */
  deactivated(): void;

  /** 挂载应用 */
  mount<T>(container?: ContainerType, callback?: CallbackFunction<T>): void;

  /** 错误处理 */
  onError(): void;

  /** 挂载完成回调 */
  onMount(): void;

  /** 注册运行中的应用 */
  registerRunningApp(): void;

  /** 启动加载 */
  start(): Promise<void>;

  /** 卸载应用 */
  unmount(needDestroy?: boolean): void;

  /** 获取状态 */
  get status(): ValueOfAppState;

  /** 设置状态 */
  set status(value: ValueOfAppState);
}
```

## 类型别名

### ContainerType

容器类型。

```typescript
type ContainerType = HTMLElement | ShadowRoot;
```

### SourceType

资源类型。

```typescript
/** 资源函数类型 */
type SourceFuncType = () => Promise<string[]>;

/** 资源类型 - 静态列表或动态函数 */
type SourceType = string[] | SourceFuncType;
```

### FetchSourceType

资源获取函数类型。

```typescript
type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
```

### CallbackFunction

回调函数类型。

```typescript
type CallbackFunction<T = unknown> = (instance: BaseModel, exportInstance?: T) => void;
```

## 全局类型声明

子应用中可用的全局类型。

```typescript
declare global {
  interface Window {
    /** 是否在 BK-WeWeb 环境中 */
    __POWERED_BY_BK_WEWEB__?: boolean;

    /** 应用唯一标识 */
    __BK_WEWEB_APP_KEY__?: string;

    /** 主应用传递的数据 */
    __BK_WEWEB_DATA__?: Record<string, unknown>;

    /** 原始 window 对象 */
    rawWindow?: Window;

    /** 原始 document 对象 */
    rawDocument?: Document;

    /** 获取应用实例 */
    __getAppOrInstance__(id?: string): any;
  }

  interface Node {
    /** 所属应用标识 */
    __BK_WEWEB_APP_KEY__?: string;
  }
}
```

## 使用示例

### 类型导入

```typescript
import {
  WewebMode,
  type IAppModelProps,
  type IJsModelProps,
  type IStartOption,
  type BaseModel,
  type ContainerType,
  type SourceType,
  type CallbackFunction,
} from '@blueking/bk-weweb';
```

### 自定义类型扩展

```typescript
// 扩展传递数据类型
interface MyAppData {
  userId: string;
  token: string;
  permissions: string[];
  config: {
    theme: 'light' | 'dark';
    language: string;
  };
}

// 使用扩展类型
const props: IAppModelProps = {
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    userId: '123',
    token: 'xxx',
    permissions: ['read', 'write'],
    config: { theme: 'dark', language: 'zh-CN' },
  } satisfies MyAppData,
};
```

### 模块导出类型

```typescript
// 定义模块导出类型
interface MyModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void;
  update: (data: Record<string, unknown>) => void;
  destroy: () => void;
  getState: () => Record<string, unknown>;
}

// 使用类型
import { activated } from '@blueking/bk-weweb';

activated<MyModuleExport>('my-module', container, (instance, exportInstance) => {
  if (exportInstance) {
    exportInstance.update({ newData: true });
    const state = exportInstance.getState();
  }
});
```

## 相关文档

- [API 概述](./README.md)
- [全局变量](./global-variables.md)
- [Hooks API](../basic/hooks/README.md)
