# Hooks API 参考

## 目录

- [概述](#概述)
- [加载类 Hooks](#加载类-hooks)
- [生命周期 Hooks](#生命周期-hooks)
- [预加载 Hooks](#预加载-hooks)
- [生命周期流程图](#生命周期流程图)
- [GitHub 文档](#github-文档)

## 概述

BK-WeWeb Hooks 是一套用于编程式控制微应用和微模块生命周期的函数 API。相比 Web Component 标签，使用 Hooks 可以：

- **保持数据引用**：直接传递对象，无需 JSON 序列化
- **精细的控制**：完全控制加载、挂载、卸载时机
- **获取导出实例**：获取子应用/模块导出的方法和状态
- **自定义容器**：灵活选择渲染容器

```typescript
import {
  loadApp,
  loadInstance,
  mount,
  unmount,
  activated,
  deactivated,
  unload,
  preLoadApp,
  preLoadInstance,
  preLoadSource,
  WewebMode,
} from '@blueking/bk-weweb';
```

## 加载类 Hooks

### loadApp

加载微应用（HTML Entry）。

```typescript
function loadApp(options: IAppModelProps): Promise<MicroAppModel>;
```

**参数：**

| 属性          | 类型      | 默认值  | 说明                 |
| ------------- | --------- | ------- | -------------------- |
| url           | `string`  | -       | 应用入口 URL（必填） |
| id            | `string`  | -       | 应用唯一标识符       |
| scopeJs       | `boolean` | `true`  | JS 沙箱隔离          |
| scopeCss      | `boolean` | `true`  | CSS 样式隔离         |
| scopeLocation | `boolean` | `false` | 路由隔离             |
| setShadowDom  | `boolean` | `false` | Shadow DOM 模式      |
| keepAlive     | `boolean` | `false` | 缓存模式             |
| data          | `object`  | -       | 传递给子应用的数据   |
| initSource    | `array`   | -       | 初始化资源列表       |

**示例：**

```typescript
const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});
```

### loadInstance

加载微模块（JS Entry）。

```typescript
function loadInstance(options: IJsModelProps): Promise<MicroInstanceModel>;
```

**参数：**

| 属性       | 类型          | 默认值  | 说明                                  |
| ---------- | ------------- | ------- | ------------------------------------- |
| url        | `string`      | -       | JS 模块 URL（必填）                   |
| id         | `string`      | -       | 模块唯一标识符                        |
| mode       | `WewebMode`   | -       | 必须为 `WewebMode.INSTANCE` 或 `'js'` |
| container  | `HTMLElement` | -       | 渲染容器                              |
| scopeJs    | `boolean`     | `false` | JS 沙箱隔离                           |
| scopeCss   | `boolean`     | `true`  | CSS 样式隔离                          |
| keepAlive  | `boolean`     | `false` | 缓存模式                              |
| data       | `object`      | `{}`    | 传递给模块的数据                      |
| initSource | `array`       | `[]`    | 依赖资源列表                          |

**示例：**

```typescript
const instance = await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  scopeJs: true,
  data: { type: 'chart' },
});
```

### load

统一加载入口，根据 mode 自动选择 loadApp 或 loadInstance。

```typescript
function load(options: IBaseModelProps): Promise<BaseModel>;
```

## 生命周期 Hooks

### mount

将已加载的应用挂载到指定容器。

```typescript
function mount(appKey: string, container?: HTMLElement, callback?: (app: BaseModel) => void): void;
```

**示例：**

```typescript
await loadApp({ url: '...', id: 'my-app' });
mount('my-app', document.getElementById('container'));
```

### unmount

卸载已挂载的应用。

```typescript
function unmount(appKey: string): void;
```

**示例：**

```typescript
unmount('my-app');
```

### activated

激活已停用的应用（keepAlive 模式）。

```typescript
function activated(
  appKey: string,
  container: HTMLElement,
  callback?: (app: BaseModel, exportInstance?: any) => void,
): void;
```

**示例：**

```typescript
activated('my-app', container, (app, exportInstance) => {
  console.log('应用已激活', exportInstance);
  // 可调用模块导出的方法
  exportInstance?.update({ newData: true });
});
```

### deactivated

停用已激活的应用（keepAlive 模式），保留 DOM 和状态。

```typescript
function deactivated(appKey: string): void;
```

**示例：**

```typescript
deactivated('my-app');
```

### unload

删除缓存的应用资源。

```typescript
function unload(url: string): void;
```

**示例：**

```typescript
unload('http://localhost:8001/');
```

## 预加载 Hooks

### preLoadApp

预加载微应用（利用浏览器空闲时间）。

```typescript
function preLoadApp(options: IAppModelProps): void;
```

**示例：**

```typescript
// 页面加载完成后预加载
window.addEventListener('load', () => {
  setTimeout(() => {
    preLoadApp({
      url: 'http://localhost:8001/',
      id: 'dashboard-app',
      scopeJs: true,
    });
  }, 2000);
});

// 需要时直接挂载
function showDashboard() {
  mount('dashboard-app', document.getElementById('container'));
}
```

### preLoadInstance

预加载微模块。

```typescript
function preLoadInstance(options: IJsModelProps): void;
```

**示例：**

```typescript
preLoadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
});
```

### preLoadSource

预加载资源文件（JS/CSS）。

```typescript
function preLoadSource(sourceList: string[] | (() => Promise<string[]>)): void;
```

**示例：**

```typescript
// 静态资源列表
preLoadSource(['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/echarts.min.js']);

// 动态获取资源列表
preLoadSource(async () => {
  const response = await fetch('/api/common-resources');
  const data = await response.json();
  return data.resources;
});
```

## 生命周期流程图

### 微应用生命周期

```
                    loadApp()
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADING                   │
    │         (加载 HTML/CSS/JS)             │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADED                    │
    │           (资源加载完成)               │
    └───────────────────────────────────────┘
                        │
                        ▼ mount()
    ┌───────────────────────────────────────┐
    │              MOUNTED                   │
    │             (已挂载)                   │
    └───────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼ unmount()                 ▼ deactivated()
    ┌───────────┐              ┌───────────────┐
    │  UNMOUNT  │              │  DEACTIVATED  │
    │  (已卸载) │              │   (已停用)    │
    └───────────┘              └───────────────┘
                                      │
                                      ▼ activated()
                               ┌───────────────┐
                               │   ACTIVATED   │
                               │   (已激活)    │
                               └───────────────┘
```

### 微模块生命周期

```
                  loadInstance()
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADING                   │
    │            (加载 JS)                   │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADED                    │
    │      (执行脚本，调用 render)           │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              MOUNTED                   │
    │            (已挂载)                    │
    └───────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼ unmount()                 ▼ deactivated()
    ┌───────────┐              ┌───────────────┐
    │  UNMOUNT  │              │  DEACTIVATED  │
    └───────────┘              └───────────────┘
                                      │
                                      ▼ activated()
                               ┌───────────────┐
                               │   ACTIVATED   │
                               └───────────────┘
```

## GitHub 文档

详细文档请访问：

- [Hooks 概述](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/README.md)
- [loadApp](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/load-app.md)
- [loadInstance](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/load-instance.md)
- [mount](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/mount.md)
- [unmount](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/unmount.md)
- [activated](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/activated.md)
- [deactivated](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/hooks/deactivated.md)
- [预加载](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/advanced/preload.md)
