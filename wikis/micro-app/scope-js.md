# scopeJs · JS 沙箱

- 类型：`boolean`
- 默认值：`true`（微应用）
- 适用模式：微应用 / 微模块

`scopeJs` 控制是否为子应用启用 **JS 沙箱**。开启后，框架会创建一个 `SandBox`，通过 `Proxy` 代理 `window` / `document` 等全局对象，把子应用对全局环境的读写收敛到独立沙箱，避免污染主应用，也避免多个子应用之间相互干扰。

## 工作机制

`MicroAppModel` 构造时，若 `scopeJs` 为真则初始化沙箱：

```ts
if (this.scopeJs) {
  this.sandBox = new SandBox(this);
}
```

挂载时调用 `sandBox.activated(data)` 激活沙箱，卸载/失活时 `sandBox.deactivated()`。沙箱的具体代理实现见 [沙箱实现原理](../principles/sandbox)。

## Hooks 用法（推荐）

Hooks API 的语义直观：`scopeJs` 默认 `true`，显式传 `false` 关闭。

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

// 开启沙箱（默认）
await loadApp({ url, id: 'a', scopeJs: true });

// 关闭沙箱：子应用直接操作主应用真实 window
await loadApp({ url, id: 'b', scopeJs: false });
```

## 标签用法注意（语义被取反）

::: warning 已知行为
在 `<bk-weweb>` 标签的**微应用模式**下，`scopeJs` 的取值会被取反，与 Hooks API 不一致。源码计算方式为 `scopeJs: !getBooleanAttr('scopeJs')`，其结果为：

| 标签写法 | 实际 scopeJs |
| --- | --- |
| 不写 `scopeJs` | `true`（开启，默认） |
| `scopeJs` 或 `scopeJs="true"` | `false`（**关闭**） |
| `scopeJs="false"` | `true`（开启） |

也就是说，**标签上写 `scopeJs` 反而会关闭沙箱**。因此：

- 想开启沙箱：**不要写** `scopeJs` 属性（默认即开启）。
- 想关闭沙箱：写 `scopeJs="false"` 并不会关闭——请改用 Hooks API（`loadApp({ scopeJs: false })`）来精确控制。

这看起来是源码中的一个缺陷。在它被修正前，涉及 JS 隔离开关时建议统一使用 Hooks API。
:::

## 何时关闭

- 子应用需要直接读写主应用全局对象、共享某些单例时。
- 调试阶段排查沙箱代理引起的兼容问题时。

关闭沙箱意味着失去隔离，子应用的全局副作用会直接作用于主应用，请谨慎使用。
