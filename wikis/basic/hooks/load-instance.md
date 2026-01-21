# loadInstance

## 概述

`loadInstance` 用于加载**微模块**。它会获取远程 JavaScript 模块文件，在沙箱环境中执行，并自动调用模块导出的 `render` 方法（如果存在）。

## 函数签名

```typescript
function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel>;
```

## 参数

### IJsModelProps

| 参数             | 类型                                | 必填   | 默认值  | 说明               |
| ---------------- | ----------------------------------- | ------ | ------- | ------------------ |
| `url`            | `string`                            | **是** | -       | JS 模块 URL        |
| `id`             | `string \| null`                    | **是** | -       | 模块唯一标识符     |
| `mode`           | `WewebMode.INSTANCE`                | 否     | -       | 运行模式（可省略） |
| `container`      | `HTMLElement \| ShadowRoot \| null` | 否     | -       | 挂载容器           |
| `scopeJs`        | `boolean`                           | 否     | `false` | JS 沙箱隔离        |
| `scopeCss`       | `boolean`                           | 否     | `true`  | CSS 样式隔离       |
| `keepAlive`      | `boolean`                           | 否     | `false` | 缓存模式           |
| `showSourceCode` | `boolean`                           | 否     | `true`  | 显示源码           |
| `data`           | `Record<string, unknown>`           | 否     | `{}`    | 传递给模块的数据   |
| `initSource`     | `SourceType`                        | 否     | `[]`    | 初始化资源列表     |
| `isPreLoad`      | `boolean`                           | 否     | `false` | 是否预加载         |
| `fetchSource`    | `FetchSourceType`                   | 否     | -       | 自定义资源获取函数 |

## 返回值

```typescript
Promise<MicroInstanceModel>;
```

返回微模块模型实例。

## 使用示例

### 基础用法

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 加载模块
const instance = await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
});

// 激活模块
activated('my-widget', document.getElementById('container'));

// 停用模块
deactivated('my-widget');
```

### 完整配置

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

const instance = await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('chart-container'),

  // 隔离配置
  scopeJs: true,
  scopeCss: true,

  // 显示配置
  showSourceCode: true,

  // 缓存配置
  keepAlive: false,

  // 数据传递
  data: {
    chartType: 'line',
    title: '销售趋势',
    options: {
      showLegend: true,
      animation: true,
    },
  },

  // 初始化资源（加载 echarts）
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

// 激活并获取导出实例
activated('chart-widget', document.getElementById('chart-container'), (instance, exportInstance) => {
  console.log('模块已激活');
  console.log('导出实例:', exportInstance);

  // 调用模块方法
  if (exportInstance?.update) {
    exportInstance.update({ chartType: 'bar' });
  }
});
```

### 获取模块导出

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

interface ChartExport {
  render: (container: HTMLElement, data: any) => void;
  update: (data: any) => void;
  destroy: () => void;
  getState: () => any;
}

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  data: { type: 'line' },
});

// 通过回调获取导出实例
activated<ChartExport>('chart-widget', document.getElementById('container'), (instance, exportInstance) => {
  // exportInstance 类型为 ChartExport
  if (exportInstance) {
    // 调用模块方法
    const state = exportInstance.getState();
    exportInstance.update({ type: 'bar' });
  }
});
```

### 动态加载多个模块

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

interface WidgetConfig {
  id: string;
  url: string;
  containerId: string;
  data?: Record<string, unknown>;
}

async function loadWidgets(widgets: WidgetConfig[]) {
  for (const widget of widgets) {
    await loadInstance({
      url: widget.url,
      id: widget.id,
      mode: WewebMode.INSTANCE,
      container: document.getElementById(widget.containerId),
      scopeJs: true,
      data: widget.data,
    });

    activated(widget.id, document.getElementById(widget.containerId)!);
  }
}

// 使用
loadWidgets([
  { id: 'chart-1', url: 'http://widgets/chart.js', containerId: 'chart-container' },
  { id: 'table-1', url: 'http://widgets/table.js', containerId: 'table-container' },
  { id: 'map-1', url: 'http://widgets/map.js', containerId: 'map-container' },
]);
```

### 带依赖的模块

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

// Vue2 组件模块，需要先加载 Vue
await loadInstance({
  url: 'http://localhost:8002/vue2-component.js',
  id: 'vue2-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  initSource: [
    'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js',
    'https://cdn.jsdelivr.net/npm/element-ui@2.15.0/lib/index.js',
    'https://cdn.jsdelivr.net/npm/element-ui@2.15.0/lib/theme-chalk/index.css',
  ],
  data: {
    title: 'Legacy Widget',
  },
});
```

## 返回值详解

`MicroInstanceModel` 实例包含以下主要属性和方法：

### 属性

| 属性        | 类型                      | 说明       |
| ----------- | ------------------------- | ---------- |
| `name`      | `string`                  | 模块名称   |
| `url`       | `string`                  | 模块 URL   |
| `status`    | `AppState`                | 模块状态   |
| `container` | `ContainerType`           | 挂载容器   |
| `data`      | `Record<string, unknown>` | 传递的数据 |
| `sandBox`   | `SandBox`                 | 沙箱实例   |
| `source`    | `EntrySource`             | 资源实例   |
| `isPreLoad` | `boolean`                 | 是否预加载 |
| `keepAlive` | `boolean`                 | 是否缓存   |

### 方法

| 方法                              | 说明     |
| --------------------------------- | -------- |
| `start()`                         | 启动加载 |
| `mount(container?, callback?)`    | 挂载     |
| `unmount(needDestroy?)`           | 卸载     |
| `activated(container, callback?)` | 激活     |
| `deactivated()`                   | 停用     |

## 内部实现逻辑

```typescript
export function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel> {
  beforeLoad();

  return new Promise(resolve => {
    let instance = appCache.getApp(props.id);

    if (!instance) {
      // 创建新实例
      instance = new MicroInstanceModel(props);
      appCache.setApp(instance);
      instance.start().then(() => resolve(instance as MicroInstanceModel));
      return;
    }

    // 实例已存在，等待状态变更
    if (instance.status in [AppState.MOUNTING, AppState.UNSET]) {
      const timer = setInterval(() => {
        if (instance.status in [AppState.ERROR, AppState.MOUNTED]) {
          resolve(instance as MicroInstanceModel);
          clearInterval(timer);
        }
      }, 300);
      return;
    }

    instance.data = props.data || instance.data || {};
    resolve(instance as MicroInstanceModel);
  });
}
```

## 与 loadApp 的区别

| 特性                  | loadApp | loadInstance |
| --------------------- | ------- | ------------ |
| 入口类型              | HTML    | JS           |
| scopeJs 默认值        | `true`  | `false`      |
| showSourceCode 默认值 | `false` | `true`       |
| 自动 render           | ❌      | ✅           |
| 获取导出实例          | ❌      | ✅           |
| scopeLocation 支持    | ✅      | ❌           |

## 错误处理

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

try {
  await loadInstance({
    url: 'http://localhost:8002/widget.js',
    id: 'my-widget',
    mode: WewebMode.INSTANCE,
  });
} catch (error) {
  console.error('模块加载失败:', error);
}
```

## 类型定义

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

type SourceType = string[] | (() => Promise<string[]>);
type ContainerType = HTMLElement | ShadowRoot;
```

## 相关函数

- [load](./load.md) - 统一加载入口
- [loadApp](./load-app.md) - 加载微应用
- [activated](./activated.md) - 激活
- [deactivated](./deactivated.md) - 停用
