# deactivated

使一个应用失活。是否保留状态取决于该应用是否开启了 [`keepAlive`](../micro-app/keep-alive)。

```ts
function deactivated(appKey: string): void;
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `appKey` | `string` | 应用标识 |

## 行为

仅当应用当前处于 `ACTIVATED` 或 `MOUNTED` 状态时才处理：

- **`keepAlive: true`**：调用实例的 `deactivated()`，把状态置为 `DEACTIVATED` 并**保留 DOM 与运行状态**，沙箱进入失活态。后续可用 [`activated`](./activated) 恢复。
- **`keepAlive: false`**：等价于 [`unmount`](./unmount)，清空容器内容。

失活后若已无活跃应用，同样会调用 `resetBodyAndHeaderMethods()` 还原全局方法。

## 示例

```ts
import { activated, deactivated } from '@blueking/bk-weweb';

// 进入
activated('list', containerEl);

// 离开（keepAlive=true 时保留，下次 activated 秒级恢复）
deactivated('list');
```

## keepAlive 行为对照

| `keepAlive` | `deactivated` 效果 | 再次 `activated` |
| --- | --- | --- |
| `true` | 保留 DOM/状态，置 `DEACTIVATED` | 恢复原 DOM 与状态，不重跑脚本 |
| `false` | 等价于 `unmount`，清空容器 | 重新挂载并执行脚本 |

> 想要"前进保留、后退复用"的体验，记得在 [`loadApp`](./load) 时传 `keepAlive: true`，并用 `activated` / `deactivated` 成对管理。
