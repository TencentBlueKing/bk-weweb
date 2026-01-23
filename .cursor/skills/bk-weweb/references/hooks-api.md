# Hooks API 详解

## loadApp - 加载微应用

```typescript
function loadApp(props: IAppModelProps): Promise<MicroAppModel>;
```

### 参数

```typescript
interface IAppModelProps {
  url: string; // 必填，应用入口 URL
  id?: string; // 应用唯一标识
  mode?: 'app'; // 运行模式，默认 'app'
  scopeJs?: boolean; // JS 沙箱隔离，默认 true
  scopeCss?: boolean; // CSS 样式隔离，默认 true
  scopeLocation?: boolean; // 路由隔离，默认 false
  setShadowDom?: boolean; // Shadow DOM 模式，默认 false
  keepAlive?: boolean; // 缓存模式，默认 false
  showSourceCode?: boolean; // 显示源码，默认 false
  data?: Record<string, unknown>; // 传递数据
  initSource?: string[]; // 初始化资源列表
  container?: HTMLElement; // 容器元素
  fetchSource?: (url: string, options: object) => Promise<string>;
}
```

### 使用示例

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
  scopeLocation: true, // 路由隔离
  keepAlive: true, // 开启缓存
  data: {
    userId: '123',
    token: 'xxx',
    config: { theme: 'dark' },
  },
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/common.css'],
});

mount('dashboard', document.getElementById('container'));
```

## loadInstance - 加载微模块

```typescript
function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel>;
```

### 参数

```typescript
interface IJsModelProps {
  url: string; // 必填，JS 模块 URL
  id: string; // 必填，模块唯一标识
  mode: 'js'; // 必填，设为 'js'
  scopeJs?: boolean; // JS 沙箱隔离，默认 false
  scopeCss?: boolean; // CSS 样式隔离，默认 true
  keepAlive?: boolean; // 缓存模式，默认 false
  showSourceCode?: boolean; // 显示源码，默认 true
  data?: Record<string, unknown>; // 传递数据
  initSource?: string[]; // 初始化资源
  container?: HTMLElement; // 容器元素
}
```

### 使用示例

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE, // 或 'js'
  container: document.getElementById('container'),
  scopeJs: true,
  scopeCss: true,
  data: { chartType: 'line', title: '销售趋势' },
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

// 激活模块，获取导出实例
activated('chart-widget', container, (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);
  // 调用模块方法
  exportInstance?.update({ newData: true });
});

// 停用
deactivated('chart-widget');
```

## mount - 挂载

```typescript
function mount<T>(
  appKey: string,
  container?: HTMLElement,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;
```

### 使用示例

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({ url: '...', id: 'my-app' });

mount('my-app', document.getElementById('container'), instance => {
  console.log('应用已挂载', instance.name);
});
```

## unmount - 卸载

```typescript
function unmount(appKey: string): void;
```

### 使用示例

```typescript
import { unmount } from '@blueking/bk-weweb';

// 卸载应用
unmount('my-app');
```

## activated / deactivated - 激活/停用

用于 `keepAlive` 模式下的应用状态切换：

```typescript
function activated<T>(
  appKey: string,
  container: HTMLElement,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;

function deactivated(appKey: string): void;
```

### 使用示例

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 加载时开启 keepAlive
await loadApp({
  url: '...',
  id: 'cached-app',
  keepAlive: true,
});

// 显示应用
activated('cached-app', container);

// 隐藏应用（保留状态）
deactivated('cached-app');

// 再次显示（状态恢复）
activated('cached-app', container);
```

## unload - 删除缓存

```typescript
function unload(url: string): void;
```

### 使用示例

```typescript
import { unload } from '@blueking/bk-weweb';

// 删除应用缓存
unload('http://localhost:8001/');
```

## 预加载 API

### preLoadApp

```typescript
function preLoadApp(options: IAppModelProps): void;
```

### preLoadInstance

```typescript
function preLoadInstance(options: IJsModelProps): void;
```

### preLoadSource

```typescript
function preLoadSource(sourceList: string[] | (() => Promise<string[]>)): void;
```

### 使用示例

```typescript
import { preLoadApp, preLoadInstance, preLoadSource, mount } from '@blueking/bk-weweb';

// 预加载微应用
preLoadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
});

// 预加载微模块
preLoadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: 'js',
});

// 预加载资源
preLoadSource(['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/echarts.min.js']);

// 动态获取资源列表
preLoadSource(async () => {
  const response = await fetch('/api/common-resources');
  const data = await response.json();
  return data.resources;
});

// 需要时直接挂载
function showApp() {
  mount('dashboard', container);
}
```

## 生命周期流程

```
loadApp/loadInstance
        │
        ▼
    LOADING (加载资源)
        │
        ▼
    LOADED (资源加载完成)
        │
        ▼ mount()
    MOUNTING (正在挂载)
        │
        ▼
    MOUNTED (已挂载)
        │
    ┌───┴───┐
    │       │
    ▼       ▼
unmount() deactivated()
    │       │
    ▼       ▼
UNMOUNT  DEACTIVATED
            │
            ▼ activated()
        ACTIVATED
```

## 应用状态枚举

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
