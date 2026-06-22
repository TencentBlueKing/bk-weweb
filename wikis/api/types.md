# 类型定义

本页汇总框架对外的核心 TypeScript 类型，便于在 TS 项目中获得类型提示。以下以源码 `src/typings` 为准。

## WewebMode

运行模式枚举。

```ts
enum WewebMode {
  APP = 'app',       // 微应用
  CONFIG = 'config', // 配置模式（内部）
  INSTANCE = 'js',   // 微模块
}
```

## IBaseModelProps

所有模型的公共属性基类。

```ts
interface IBaseModelProps {
  mode?: WewebMode;
  url: string;                 // 必填
  id?: string | null;
  isPreLoad?: boolean;
  fetchSource?: (url: string, options: Record<string, unknown>) => Promise<string>;
}
```

## IAppModelProps（微应用）

```ts
interface IAppModelProps extends IBaseModelProps {
  data?: Record<string, unknown>;
  keepAlive?: boolean;
  scopeCss?: boolean;       // 默认 true
  scopeJs?: boolean;        // 默认 true
  scopeLocation?: boolean;  // 默认 false
  setShadowDom?: boolean;   // 默认 false
  showSourceCode?: boolean; // 默认 false
  container?: HTMLElement | ShadowRoot | null;
  initSource?: string | string[];
}
```

## IJsModelProps（微模块）

```ts
interface IJsModelProps extends IBaseModelProps {
  data?: Record<string, unknown>;
  showSourceCode?: boolean; // 默认 true
  container?: HTMLElement | ShadowRoot | null;
  initSource?: string | string[];
  keepAlive?: boolean;      // 默认 false
  scopeCss?: boolean;       // 默认 true
  scopeJs?: boolean;        // 默认 true
}
```

> 默认值由对应模型类（`MicroAppModel` / `MicroInstanceModel`）的构造函数决定。`<bk-weweb>` 标签用法对部分布尔属性的解析与此不同，详见[微应用](../micro-app/)各属性页。

## BaseModel

应用/模块实例对外暴露的接口（节选）。

```ts
interface BaseModel {
  readonly appCacheKey: string;
  name: string;
  url: string;
  data: Record<string, unknown>;
  container?: HTMLElement | ShadowRoot;
  sandBox?: SandBox;
  scopeJs: boolean;
  scopeCss?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  isPreLoad: boolean;
  source?: EntrySource;

  start(): Promise<void>;
  mount<T>(container?: ContainerType, callback?: CallbackFunction<T>): void;
  unmount(needDestroy?: boolean): void;
  activated<T>(container: ContainerType, callback?: CallbackFunction<T>): void;
  deactivated(): void;
  onMount(): void;
  onError(): void;
  registerRunningApp(): void;
  get status(): ValueOfAppState;
  set status(value: ValueOfAppState);
}
```

## IStartOption

```ts
interface IStartOption {
  collectBaseSource?: boolean;
  fetchSource?: FetchSourceType;
  webComponentTag?: string;
}

type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
```

## ContainerType / CallbackFunction

```ts
type ContainerType = HTMLElement | ShadowRoot;
type CallbackFunction<T = unknown> = (instance: BaseModel, exportInstance?: T) => void;
```

## 资源相关类型

```ts
interface IStyleOption {
  code: string;
  fromHtml: boolean;
  initial?: boolean;
  prefetch?: boolean;
  preload?: boolean;
  url?: string;
}

interface IScriptOption {
  async: boolean;
  code: string;
  defer: boolean;
  fromHtml: boolean;
  initial?: boolean;
  isModule: boolean;
  url?: string;
}
```

## AppState

应用状态常量（值为同名字符串）：

```ts
const AppState = {
  UNSET, LOADING, LOADED, MOUNTING, MOUNTED,
  ACTIVATED, DEACTIVATED, UNMOUNT, ERROR,
} as const;
```

## WewebCustomAttrs

`<bk-weweb>` 支持的属性名枚举：`data`、`id`、`keepAlive`、`mode`、`scopeCss`、`scopeJs`、`scopeLocation`、`setShadowDom`、`setShodowDom`（已废弃）、`showSourceCode`、`url`。
