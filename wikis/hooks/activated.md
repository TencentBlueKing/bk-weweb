# activated

激活一个应用，常用于 [KeepAlive](../micro-app/keep-alive) 模式下恢复一个已失活的应用。

```ts
function activated<T>(
  appKey: string,
  container: HTMLElement | ShadowRoot,
  callback?: (instance: BaseModel, exportInstance?: T) => void,
): void;
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `appKey` | `string` | 应用标识 |
| `container` | `HTMLElement \| ShadowRoot` | 目标容器 |
| `callback` | 函数 | 激活完成回调（微模块可拿到导出实例） |

## 行为

`activated` 会根据应用当前状态智能选择策略：

- **应用已失活（`DEACTIVATED`）且开启了 `keepAlive`**：执行真正的"激活"——把之前保留的 DOM 节点转移到新容器，恢复沙箱与运行状态，不重新执行脚本。
- **其他情况**：退化为一次常规 [`mount`](./mount)。

两种分支都通过 `nextTask` 异步执行，并在执行前调用 `beforeLoad`。

## 示例

KeepAlive 下的路由切换：

```ts
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 首次加载时开启 keepAlive
await loadApp({ url: 'http://localhost:8001/', id: 'list', keepAlive: true });

// 进入页面：激活（首次为挂载，再次为状态恢复）
activated('list', containerEl);

// 离开页面：失活（保留 DOM 与状态）
deactivated('list');
```

## 注意事项

- 只有在加载时设置了 `keepAlive: true`，`activated` 才能在再次进入时恢复状态；否则等同于重新挂载。
- 必须先完成一次 `loadApp` / `loadInstance`，缓存中存在实例后 `activated` 才生效。
- 与之配对的失活方法是 [`deactivated`](./deactivated)。
