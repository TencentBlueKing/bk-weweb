# API 概述

本文档提供 BK-WeWeb 的完整 API 参考。

## 导入方式

```typescript
// 默认导入主类
import weWeb from '@blueking/bk-weweb';

// 按需导入
import {
  // 生命周期 Hooks
  load,
  loadApp,
  loadInstance,
  mount,
  unmount,
  unload,
  activated,
  deactivated,

  // 预加载
  preLoadApp,
  preLoadInstance,
  preLoadSource,

  // 类型
  WewebMode,
} from '@blueking/bk-weweb';
```

## 核心 API

### WeWeb 类

| 方法/属性               | 说明           |
| ----------------------- | -------------- |
| `weWeb.start(options)`  | 启动并配置框架 |
| `weWeb.webComponentTag` | 自定义标签名   |

详见 [WeWeb 类](./weweb-class.md)

### 生命周期 Hooks

| API                                       | 参数                          | 返回值                        | 说明         |
| ----------------------------------------- | ----------------------------- | ----------------------------- | ------------ |
| `load(props)`                             | `IBaseModelProps`             | `Promise<BaseModel>`          | 统一加载入口 |
| `loadApp(props)`                          | `IAppModelProps`              | `Promise<MicroAppModel>`      | 加载微应用   |
| `loadInstance(props)`                     | `IJsModelProps`               | `Promise<MicroInstanceModel>` | 加载微模块   |
| `mount(appKey, container?, callback?)`    | `string, Element?, Function?` | `void`                        | 挂载         |
| `unmount(appKey)`                         | `string`                      | `void`                        | 卸载         |
| `unload(url)`                             | `string`                      | `void`                        | 删除缓存     |
| `activated(appKey, container, callback?)` | `string, Element, Function?`  | `void`                        | 激活         |
| `deactivated(appKey)`                     | `string`                      | `void`                        | 停用         |

### 预加载 Hooks

| API                         | 参数             | 返回值 | 说明         |
| --------------------------- | ---------------- | ------ | ------------ |
| `preLoadApp(options)`       | `IAppModelProps` | `void` | 预加载微应用 |
| `preLoadInstance(options)`  | `IJsModelProps`  | `void` | 预加载微模块 |
| `preLoadSource(sourceList)` | `SourceType`     | `void` | 预加载资源   |

## Web Component 属性

`<bk-weweb>` 标签支持的属性：

| 属性               | 类型            | 默认值  | 说明             |
| ------------------ | --------------- | ------- | ---------------- |
| `id`               | `string`        | -       | 应用标识符       |
| `url`              | `string`        | -       | 入口 URL（必填） |
| `mode`             | `'app' \| 'js'` | `'app'` | 运行模式         |
| `scope-js`         | `boolean`       | 见模式  | JS 沙箱隔离      |
| `scope-css`        | `boolean`       | `true`  | CSS 样式隔离     |
| `scope-location`   | `boolean`       | `false` | 路由隔离         |
| `set-shadow-dom`   | `boolean`       | `false` | Shadow DOM 模式  |
| `keep-alive`       | `boolean`       | `false` | 缓存模式         |
| `show-source-code` | `boolean`       | 见模式  | 显示源码         |
| `data`             | `string`        | -       | 传递数据（JSON） |

## 枚举类型

### WewebMode

```typescript
enum WewebMode {
  APP = 'app', // 微应用模式
  INSTANCE = 'js', // 微模块模式
  CONFIG = 'config', // 配置模式（保留）
}
```

### AppState

```typescript
const AppState = {
  UNSET: 1, // 未设置
  LOADING: 2, // 加载中
  LOADED: 3, // 已加载
  MOUNTING: 4, // 挂载中
  MOUNTED: 5, // 已挂载
  ACTIVATED: 6, // 已激活
  DEACTIVATED: 7, // 已停用
  UNMOUNT: 8, // 已卸载
  ERROR: 9, // 错误
};
```

## 接口类型

详见 [类型定义](./types.md)

### IBaseModelProps

```typescript
interface IBaseModelProps {
  url: string;
  id?: string | null;
  mode?: WewebMode;
  isPreLoad?: boolean;
  fetchSource?: FetchSourceType;
}
```

### IAppModelProps

```typescript
interface IAppModelProps extends IBaseModelProps {
  container?: ContainerType | null;
  scopeJs?: boolean;
  scopeCss?: boolean;
  scopeLocation?: boolean;
  setShadowDom?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  data?: Record<string, unknown>;
  initSource?: SourceType;
}
```

### IJsModelProps

```typescript
interface IJsModelProps extends IBaseModelProps {
  container?: ContainerType | null;
  scopeJs?: boolean;
  scopeCss?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  data?: Record<string, unknown>;
  initSource?: SourceType;
}
```

## 全局变量

子应用中可访问的全局变量：

| 变量                             | 类型                      | 说明                 |
| -------------------------------- | ------------------------- | -------------------- |
| `window.__POWERED_BY_BK_WEWEB__` | `boolean`                 | 是否在 bk-weweb 环境 |
| `window.__BK_WEWEB_APP_KEY__`    | `string`                  | 应用标识符           |
| `window.__BK_WEWEB_DATA__`       | `Record<string, unknown>` | 主应用传递的数据     |
| `window.rawWindow`               | `Window`                  | 原始 window 对象     |
| `window.rawDocument`             | `Document`                | 原始 document 对象   |

详见 [全局变量](./global-variables.md)

## 相关文档

- [WeWeb 类](./weweb-class.md)
- [类型定义](./types.md)
- [全局变量](./global-variables.md)
