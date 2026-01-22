# Hooks API 详解

## 导入

```typescript
import {
  load,
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

## 加载 API

### loadApp

加载微应用（HTML Entry）。

```typescript
function loadApp(options: IAppModelProps): Promise<MicroAppModel>;
```

**参数**：

| 参数          | 类型    | 默认值 | 说明             |
| ------------- | ------- | ------ | ---------------- |
| url           | string  | -      | 入口 URL（必填） |
| id            | string  | -      | 唯一标识         |
| scopeJs       | boolean | true   | JS 沙箱          |
| scopeCss      | boolean | true   | CSS 隔离         |
| scopeLocation | boolean | false  | 路由隔离         |
| setShadowDom  | boolean | false  | Shadow DOM       |
| keepAlive     | boolean | false  | 缓存模式         |
| data          | object  | -      | 传递数据         |
| initSource    | array   | -      | 预加载资源       |

**示例**：

```typescript
const model = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});

console.log(model.status); // 应用状态
```

### loadInstance

加载微模块（JS Entry）。

```typescript
function loadInstance(options: IJsModelProps): Promise<MicroInstanceModel>;
```

**参数**：

| 参数       | 类型    | 默认值 | 说明                |
| ---------- | ------- | ------ | ------------------- |
| url        | string  | -      | JS 模块 URL（必填） |
| id         | string  | -      | 唯一标识（必填）    |
| mode       | 'js'    | -      | 必须为 'js'         |
| container  | Element | -      | 挂载容器            |
| scopeJs    | boolean | false  | JS 沙箱             |
| scopeCss   | boolean | true   | CSS 隔离            |
| keepAlive  | boolean | false  | 缓存模式            |
| data       | object  | -      | 传递数据            |
| initSource | array   | -      | 预加载资源          |

**示例**：

```typescript
const instance = await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  data: { chartType: 'line' },
});
```

### load

统一加载入口，根据 mode 自动选择 loadApp 或 loadInstance。

```typescript
function load(options: IBaseModelProps): Promise<BaseModel>;
```

## 生命周期 API

### mount

挂载应用到容器。

```typescript
function mount<T>(
  id: string,
  container: HTMLElement | ShadowRoot,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;
```

**示例**：

```typescript
await loadApp({ url: '...', id: 'my-app' });
mount('my-app', document.getElementById('container'));
```

### unmount

卸载应用。

```typescript
function unmount(id: string, needDestroy?: boolean): void;
```

**参数**：

- `needDestroy`: 是否销毁缓存，默认 false

**示例**：

```typescript
unmount('my-app'); // 卸载但保留缓存
unmount('my-app', true); // 卸载并销毁缓存
```

### activated

激活应用（keepAlive 模式）。

```typescript
function activated<T>(
  id: string,
  container: HTMLElement | ShadowRoot,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;
```

**示例**：

```typescript
// 激活并获取导出实例
activated('my-module', container, (instance, exportInstance) => {
  console.log('激活完成', exportInstance);
  exportInstance?.update({ newData: true });
});
```

### deactivated

停用应用（keepAlive 模式）。

```typescript
function deactivated(id: string): void;
```

**示例**：

```typescript
deactivated('my-app'); // 停用但保留 DOM 状态
```

### unload

删除缓存资源。

```typescript
function unload(url: string): void;
```

**示例**：

```typescript
unload('http://localhost:8001/'); // 完全删除缓存
```

## 预加载 API

### preLoadApp

预加载微应用（利用浏览器空闲时间）。

```typescript
function preLoadApp(options: IAppModelProps): void;
```

**示例**：

```typescript
// 应用启动后预加载
window.addEventListener('load', () => {
  setTimeout(() => {
    preLoadApp({ url: 'http://localhost:8001/', id: 'app-1' });
    preLoadApp({ url: 'http://localhost:8002/', id: 'app-2' });
  }, 2000);
});
```

### preLoadInstance

预加载微模块。

```typescript
function preLoadInstance(options: IJsModelProps): void;
```

**示例**：

```typescript
preLoadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});
```

### preLoadSource

预加载资源文件。

```typescript
function preLoadSource(sourceList: string[] | (() => Promise<string[]>)): void;
```

**示例**：

```typescript
// 静态列表
preLoadSource(['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/echarts.min.js']);

// 动态获取
preLoadSource(async () => {
  const res = await fetch('/api/common-resources');
  return res.json();
});
```

## 类型定义

### WewebMode

```typescript
enum WewebMode {
  APP = 'app', // 微应用
  INSTANCE = 'js', // 微模块
  CONFIG = 'config', // 保留
}
```

### IAppModelProps

```typescript
interface IAppModelProps {
  url: string;
  id?: string;
  mode?: WewebMode;
  container?: HTMLElement | ShadowRoot;
  scopeJs?: boolean;
  scopeCss?: boolean;
  scopeLocation?: boolean;
  setShadowDom?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  data?: Record<string, unknown>;
  initSource?: string[] | (() => Promise<string[]>);
}
```

### IJsModelProps

```typescript
interface IJsModelProps {
  url: string;
  id: string;
  mode: 'js' | WewebMode.INSTANCE;
  container?: HTMLElement | ShadowRoot;
  scopeJs?: boolean;
  scopeCss?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  data?: Record<string, unknown>;
  initSource?: string[] | (() => Promise<string[]>);
}
```

### CallbackFunction

```typescript
type CallbackFunction<T = unknown> = (instance: BaseModel, exportInstance?: T) => void;
```

## 完整工作流示例

### 微应用工作流

```typescript
import { loadApp, mount, unmount, preLoadApp } from '@blueking/bk-weweb';

// 1. 预加载（可选）
preLoadApp({ url: 'http://localhost:8001/', id: 'dashboard' });

// 2. 加载
await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});

// 3. 挂载
mount('dashboard', document.getElementById('container'));

// 4. 卸载
unmount('dashboard');
```

### 微模块工作流

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 1. 加载
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  keepAlive: true,
  data: { chartType: 'line' },
});

// 2. 激活
activated('chart', container, (instance, exportInstance) => {
  console.log('模块激活', exportInstance);
});

// 3. 停用
deactivated('chart');

// 4. 再次激活
activated('chart', anotherContainer);
```

### KeepAlive 工作流

```typescript
import { loadApp, activated, deactivated, unload } from '@blueking/bk-weweb';

// 加载并启用 keepAlive
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

// 首次激活
activated('my-app', container1);

// 切换到另一个位置
deactivated('my-app');
activated('my-app', container2);

// 完全销毁
unload('http://localhost:8001/');
```
