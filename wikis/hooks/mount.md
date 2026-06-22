# mount

把一个**已加载**的应用挂载到指定容器并渲染。

```ts
function mount<T>(
  appKey: string,
  container?: HTMLElement | ShadowRoot,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `appKey` | `string` | 应用标识，即加载时传入的 `id` |
| `container` | `HTMLElement \| ShadowRoot` | 挂载容器；省略时使用实例已记录的容器 |
| `callback` | `(instance, exportInstance?) => void` | 挂载完成回调。微模块场景下，`exportInstance` 为模块导出的对象 |

## 行为

- 从缓存按 `appKey` 取实例，存在才挂载；不存在静默返回。
- 通过内部 `nextTask` 在微任务后执行，执行前调用 `beforeLoad`，因此 `mount` **不是同步完成**。
- 微应用：把解析好的 HTML 内容克隆进容器并执行脚本。
- 微模块：清空容器 → 注入样式 → 执行脚本 → 调用导出对象的 `render(wrapper, data)`。

## 示例

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });

mount('my-app', document.getElementById('container')!, instance => {
  console.log('挂载完成', instance.name, instance.status);
});
```

获取微模块导出实例并调用其方法：

```ts
import { loadInstance, mount } from '@blueking/bk-weweb';

interface ChartApi {
  update(data: unknown): void;
}

await loadInstance({ url: 'http://localhost:8002/chart.js', id: 'chart' });

mount<ChartApi>('chart', box, (_inst, api) => {
  api?.update({ value: 42 });
});
```

## 注意事项

- 调用 `mount` 前必须先 `loadApp` / `loadInstance`（或使用预加载），否则缓存中无实例，调用无效。
- 需要在挂载真正完成后执行逻辑，请使用 `callback`，不要假设 `mount` 返回即已渲染。
- 同一应用可反复 `mount` / [`unmount`](./unmount)；若开启了 [`keepAlive`](../micro-app/keep-alive)，更推荐用 [`activated`](./activated) / [`deactivated`](./deactivated) 以保留状态。
