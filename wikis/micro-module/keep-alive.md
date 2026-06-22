# keepAlive · 缓存模式（微模块）

- 类型：`boolean`
- 默认值：`false`
- 适用模式：微模块

控制微模块在失活时是否保留 DOM 与运行状态，行为与[微应用的 keepAlive](../micro-app/keep-alive) 一致：

- `keepAlive: true`：[`deactivated`](../hooks/deactivated) 时保留节点、置 `DEACTIVATED`；[`activated`](../hooks/activated) 时转移保留节点并恢复，不重新执行模块脚本。
- `keepAlive: false`：`deactivated` 等价于 `unmount`。

## 用法

```ts
import { loadInstance, activated, deactivated } from '@blueking/bk-weweb';

await loadInstance({ url, id: 'chart', keepAlive: true });

activated('chart', box);   // 进入：首次挂载/后续恢复
deactivated('chart');      // 离开：保留状态
```

标签用法：

```html
<bk-weweb id="chart" mode="js" url="..." keepAlive></bk-weweb>
```

## 注意事项

- 需配合 `activated` / `deactivated` 使用才有保留效果；只用 `mount` / `unmount` 不会保留。
- 模块若在 `render` 中持有定时器、事件监听等资源，请在导出对象提供清理逻辑，避免 KeepAlive 期间泄漏。参见 [render 导出规范](./render-specification)。
