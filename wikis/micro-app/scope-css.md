# scopeCss · 样式隔离

- 类型：`boolean`
- 默认值：`true`（微应用）
- 适用模式：微应用 / 微模块

`scopeCss` 控制是否为子应用启用 **CSS 样式隔离**，避免子应用样式泄漏到主应用、或被主应用样式覆盖。

## 工作机制

启用后，框架在解析子应用样式时会对其规则追加作用域限定（以容器 `id` 为锚点），使样式只在子应用容器内生效。容器在挂载时会被设置 `id` 属性为应用 `name`，作为样式作用域前缀的依据。样式解析与改写细节见 [资源解析原理](../principles/entry)。

## Hooks 用法

```ts
import { loadApp } from '@blueking/bk-weweb';

await loadApp({ url, id: 'a', scopeCss: true });  // 开启（默认）
await loadApp({ url, id: 'b', scopeCss: false }); // 关闭
```

## 标签用法注意

::: warning 已知行为
在 `<bk-weweb>` 标签的**微应用模式**下，`scopeCss` **不能通过 `scopeCss` 属性单独控制**。源码中它由是否启用 Shadow DOM 决定：

```ts
scopeCss: !this.setShadowDomAttr
```

含义：

- 未启用 Shadow DOM（默认）→ `scopeCss = true`（作用域改写隔离）。
- 启用了 [`setShadowDom`](./shadow-dom) → `scopeCss = false`（交由 Shadow DOM 天然隔离，无需再做作用域改写）。

如需在不使用 Shadow DOM 的情况下关闭样式作用域改写，请使用 Hooks API：`loadApp({ scopeCss: false })`。
:::

## 与 Shadow DOM 的关系

| 隔离方式 | 原理 | 彻底性 | 兼容性 |
| --- | --- | --- | --- |
| `scopeCss`（作用域改写） | 给规则加容器前缀 | 中（依赖改写覆盖面） | 好 |
| [`setShadowDom`](./shadow-dom) | 浏览器原生 Shadow 边界 | 高（完全隔离） | 视组件库对 Shadow DOM 的支持而定 |

需要更彻底的隔离时考虑 Shadow DOM；需要更好的兼容性（如某些组件库在 Shadow DOM 下表现异常）时使用作用域改写。
