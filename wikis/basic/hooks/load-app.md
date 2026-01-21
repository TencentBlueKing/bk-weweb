# loadApp

## 概述

`loadApp` 用于加载**微应用**。它会获取远程 HTML 入口，解析其中的资源（CSS、JavaScript），创建沙箱环境，并准备挂载。

## 函数签名

```typescript
function loadApp(props: IAppModelProps): Promise<MicroAppModel>;
```

## 参数

### IAppModelProps

| 参数             | 类型                                | 必填   | 默认值  | 说明               |
| ---------------- | ----------------------------------- | ------ | ------- | ------------------ |
| `url`            | `string`                            | **是** | -       | 应用入口 URL       |
| `id`             | `string \| null`                    | 否     | -       | 应用唯一标识符     |
| `container`      | `HTMLElement \| ShadowRoot \| null` | 否     | -       | 挂载容器           |
| `scopeJs`        | `boolean`                           | 否     | `true`  | JS 沙箱隔离        |
| `scopeCss`       | `boolean`                           | 否     | `true`  | CSS 样式隔离       |
| `scopeLocation`  | `boolean`                           | 否     | `false` | 路由隔离           |
| `setShadowDom`   | `boolean`                           | 否     | `false` | Shadow DOM 模式    |
| `keepAlive`      | `boolean`                           | 否     | `false` | 缓存模式           |
| `showSourceCode` | `boolean`                           | 否     | `false` | 显示源码           |
| `data`           | `Record<string, unknown>`           | 否     | `{}`    | 传递给子应用的数据 |
| `initSource`     | `SourceType`                        | 否     | `[]`    | 初始化资源列表     |
| `isPreLoad`      | `boolean`                           | 否     | `false` | 是否预加载         |
| `fetchSource`    | `FetchSourceType`                   | 否     | -       | 自定义资源获取函数 |

## 返回值

```typescript
Promise<MicroAppModel>;
```

返回微应用模型实例，包含应用的状态和控制方法。

## 使用示例

### 基础用法

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载应用
const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 挂载到容器
mount('my-app', document.getElementById('container'));

// 卸载
unmount('my-app');
```

### 完整配置

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard-app',

  // 隔离配置
  scopeJs: true,
  scopeCss: true,
  scopeLocation: true,

  // 渲染配置
  setShadowDom: false,
  showSourceCode: false,

  // 缓存配置
  keepAlive: true,

  // 数据传递
  data: {
    userId: '12345',
    userName: 'admin',
    permissions: ['read', 'write'],
    config: {
      theme: 'dark',
      language: 'zh-CN',
    },
  },

  // 初始化资源
  initSource: ['https://cdn.example.com/vue@2.6.14/vue.min.js', 'https://cdn.example.com/element-ui/index.css'],
});

console.log('应用状态:', app.status);
console.log('应用名称:', app.name);

mount('dashboard-app', document.getElementById('app-container'));
```

### 带回调的挂载

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
});

mount('my-app', document.getElementById('container'), instance => {
  console.log('应用已挂载');
  console.log('应用状态:', instance.status);
  console.log('应用 URL:', instance.url);
});
```

### 自定义资源获取

```typescript
import { loadApp } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  fetchSource: async (url, options) => {
    // 自定义请求逻辑
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Custom-Header': 'value',
      },
    });
    return response.text();
  },
});
```

### 预加载模式

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

// 预加载（不立即渲染）
await loadApp({
  url: 'http://localhost:8001/',
  id: 'preload-app',
  isPreLoad: true,
});

// 稍后需要时再挂载
function showApp() {
  mount('preload-app', document.getElementById('container'));
}
```

## 返回值详解

`MicroAppModel` 实例包含以下主要属性和方法：

### 属性

| 属性        | 类型                        | 说明            |
| ----------- | --------------------------- | --------------- |
| `name`      | `string`                    | 应用名称        |
| `url`       | `string`                    | 应用 URL        |
| `status`    | `AppState`                  | 应用状态        |
| `container` | `ContainerType`             | 挂载容器        |
| `data`      | `Record<string, unknown>`   | 传递的数据      |
| `sandBox`   | `SandBox`                   | 沙箱实例        |
| `source`    | `EntrySource`               | 资源实例        |
| `iframe`    | `HTMLIFrameElement \| null` | 路由隔离 iframe |
| `isPreLoad` | `boolean`                   | 是否预加载      |
| `keepAlive` | `boolean`                   | 是否缓存        |

### 方法

| 方法                              | 说明     |
| --------------------------------- | -------- |
| `start()`                         | 启动加载 |
| `mount(container?, callback?)`    | 挂载     |
| `unmount(needDestroy?)`           | 卸载     |
| `activated(container, callback?)` | 激活     |
| `deactivated()`                   | 停用     |

### AppState 状态

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

## 内部实现逻辑

```typescript
export async function loadApp(props: IAppModelProps): Promise<MicroAppModel> {
  beforeLoad();

  let instance = appCache.getApp(props.id);

  if (!instance) {
    // 创建新实例
    instance = new MicroAppModel(props);
    appCache.setApp(instance);
  } else {
    // 更新数据
    instance.data = props.data || instance.data || {};
  }

  // 启动加载
  await instance.start();

  return instance as MicroAppModel;
}
```

## 错误处理

```typescript
import { loadApp } from '@blueking/bk-weweb';

try {
  const app = await loadApp({
    url: 'http://localhost:8001/',
    id: 'my-app',
  });
} catch (error) {
  // 处理加载错误
  if (error.message.includes('CORS')) {
    console.error('跨域错误，请检查子应用 CORS 配置');
  } else if (error.message.includes('Failed to fetch')) {
    console.error('网络错误，请检查子应用是否启动');
  } else {
    console.error('加载失败:', error);
  }
}
```

## 应用复用

相同 `id` 的应用会复用缓存：

```typescript
// 第一次加载
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });

// 第二次加载相同 id，会复用已加载的资源
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
```

如需强制重新加载：

```typescript
import { loadApp, unload } from '@blueking/bk-weweb';

// 先删除缓存
unload('http://localhost:8001/');

// 再重新加载
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
```

## 类型定义

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

type SourceType = string[] | (() => Promise<string[]>);
type ContainerType = HTMLElement | ShadowRoot;
```

## 相关函数

- [load](./load.md) - 统一加载入口
- [loadInstance](./load-instance.md) - 加载微模块
- [mount](./mount.md) - 挂载
- [unmount](./unmount.md) - 卸载
