# mount

## 概述

`mount` 用于将已加载的应用或模块**挂载到指定容器**中。通常在 `loadApp` 或 `loadInstance` 之后调用。

## 函数签名

```typescript
function mount<T>(
  appKey: string,
  container?: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void;
```

## 参数

| 参数        | 类型                        | 必填   | 说明                                   |
| ----------- | --------------------------- | ------ | -------------------------------------- |
| `appKey`    | `string`                    | **是** | 应用/模块的唯一标识符（id）            |
| `container` | `HTMLElement \| ShadowRoot` | 否     | 挂载容器，不传则使用 load 时指定的容器 |
| `callback`  | `Function`                  | 否     | 挂载完成后的回调函数                   |

### callback 回调参数

| 参数             | 类型        | 说明                         |
| ---------------- | ----------- | ---------------------------- |
| `instance`       | `BaseModel` | 应用/模块实例                |
| `exportInstance` | `T`         | 模块导出的实例（仅微模块有） |

## 返回值

```typescript
void
```

`mount` 是异步操作，但不返回 Promise。如需在挂载完成后执行逻辑，请使用 `callback` 回调。

## 使用示例

### 基础用法

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 1. 先加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 2. 挂载到容器
mount('my-app', document.getElementById('container'));

// 3. 卸载
unmount('my-app');
```

### 带回调

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: { userId: '123' },
});

mount('my-app', document.getElementById('container'), instance => {
  console.log('应用已挂载');
  console.log('应用状态:', instance.status);
  console.log('应用 URL:', instance.url);
  console.log('应用数据:', instance.data);
});
```

### 微模块获取导出实例

```typescript
import { loadInstance, mount, WewebMode } from '@blueking/bk-weweb';

interface WidgetExport {
  update: (data: any) => void;
  getState: () => any;
  destroy: () => void;
}

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
});

mount<WidgetExport>('my-widget', document.getElementById('container'), (instance, exportInstance) => {
  console.log('模块已挂载');

  if (exportInstance) {
    // 调用模块导出的方法
    const state = exportInstance.getState();
    console.log('模块状态:', state);

    // 更新模块
    exportInstance.update({ newData: true });
  }
});
```

### 动态切换容器

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 首次挂载到容器 A
mount('my-app', document.getElementById('container-a'));

// 点击按钮后切换到容器 B
function moveToContainerB() {
  mount('my-app', document.getElementById('container-b'));
}
```

### 多个应用挂载

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

// 加载多个应用
await Promise.all([
  loadApp({ url: 'http://localhost:8001/', id: 'app-1' }),
  loadApp({ url: 'http://localhost:8002/', id: 'app-2' }),
  loadApp({ url: 'http://localhost:8003/', id: 'app-3' }),
]);

// 分别挂载到不同容器
mount('app-1', document.getElementById('container-1'));
mount('app-2', document.getElementById('container-2'));
mount('app-3', document.getElementById('container-3'));
```

## 内部实现

```typescript
export function mount<T>(
  appKey: string,
  container?: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void {
  const app = appCache.getApp(appKey);

  if (app) {
    nextTask(() => {
      beforeLoad();
      app.mount(container, callback);
    });
  }
}
```

`mount` 内部使用 `nextTask` 确保在下一个微任务中执行挂载，这样可以：

- 避免同步执行导致的 UI 阻塞
- 确保 DOM 更新后再挂载

## 与 activated 的区别

| 特性           | mount        | activated          |
| -------------- | ------------ | ------------------ |
| 首次挂载       | ✅           | ✅                 |
| keepAlive 恢复 | 完全重新挂载 | 恢复之前状态       |
| 适用场景       | 通用挂载     | keepAlive 场景     |
| 状态保留       | ❌           | ✅（keepAlive 时） |

```typescript
// 普通场景使用 mount
mount('my-app', container);

// keepAlive 场景使用 activated
activated('my-app', container);
```

## 错误处理

```typescript
import { loadApp, mount } from '@blueking/bk-weweb';

// 确保应用已加载
const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 检查容器是否存在
const container = document.getElementById('container');
if (!container) {
  console.error('容器不存在');
  return;
}

mount('my-app', container, instance => {
  if (instance.status === 9) {
    // ERROR
    console.error('挂载失败');
  } else {
    console.log('挂载成功');
  }
});
```

## 注意事项

### 1. 必须先加载

```typescript
// ❌ 错误：未加载就挂载
mount('my-app', container); // 无效，应用不存在

// ✅ 正确：先加载后挂载
await loadApp({ url: '...', id: 'my-app' });
mount('my-app', container);
```

### 2. 容器必须在 DOM 中

```typescript
// ❌ 错误：容器未插入 DOM
const div = document.createElement('div');
mount('my-app', div); // 可能导致样式问题

// ✅ 正确：容器已在 DOM 中
const container = document.getElementById('existing-container');
mount('my-app', container);
```

### 3. 异步完成

```typescript
// mount 是异步的，不会立即完成
mount('my-app', container);
console.log('这行会先执行');

// 使用回调处理挂载完成
mount('my-app', container, () => {
  console.log('挂载完成后执行');
});
```

## 类型定义

```typescript
function mount<T>(
  appKey: string,
  container?: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void;

interface BaseModel {
  name: string;
  url: string;
  status: ValueOfAppState;
  container?: ContainerType;
  data: Record<string, unknown>;
  // ...
}
```

## 相关函数

- [loadApp](./load-app.md) - 加载微应用
- [loadInstance](./load-instance.md) - 加载微模块
- [unmount](./unmount.md) - 卸载
- [activated](./activated.md) - 激活
