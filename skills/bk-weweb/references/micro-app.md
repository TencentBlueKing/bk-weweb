# 微应用（mode=app）属性详解

微应用入口是 HTML，框架拉取并解析 HTML，提取并执行其中的 `<script>`/`<style>`，把内容渲染到容器。子应用通常**无需改造**即可被加载。

## 属性速查（Hooks `loadApp` 传入时的默认值）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**，应用入口 HTML 地址 |
| `id` | `string` | 随机串 | 唯一标识；同时作为缓存键与挂载键，建议显式设置 |
| `mode` | `'app'` | `'app'` | 可省略 |
| `scopeJs` | `boolean` | `true` | JS 沙箱隔离 |
| `scopeCss` | `boolean` | `true` | CSS 样式隔离 |
| `scopeLocation` | `boolean` | `false` | 路由隔离（启用隐藏 iframe） |
| `setShadowDom` | `boolean` | `false` | 使用 Shadow DOM |
| `keepAlive` | `boolean` | `false` | 缓存模式 |
| `showSourceCode` | `boolean` | `false` | 保留源码便于调试 |
| `data` | `object` | `{}` | 传给子应用的数据 |
| `initSource` | `string \| string[]` | `[]` | 入口之外需预先加载的初始化资源 |
| `fetchSource` | `function` | — | 应用级自定义资源获取（优先级最高） |

> 标签用法下 `id` 缺省时回退用 `url` 作为键（`appKey = id || url`）；`data` 属性是 **JSON 字符串**（解析失败回退 `{}`）。

## scopeJs · JS 沙箱

开启后创建 `SandBox`，用 `Proxy` 代理 `window`/`document`，把子应用对全局环境的读写收敛到独立沙箱，避免污染主应用与互相干扰。

```ts
await loadApp({ url, id: 'a', scopeJs: true });  // 开启（默认）
await loadApp({ url, id: 'b', scopeJs: false }); // 关闭：子应用直接操作真实 window
```

⚠️ **标签用法语义被取反**（源码 `scopeJs: !getBooleanAttr('scopeJs')`）：

| 标签写法 | 实际 scopeJs |
| --- | --- |
| 不写 `scopeJs` | `true`（开启，默认） |
| `scopeJs` / `scopeJs="true"` | `false`（**关闭**） |
| `scopeJs="false"` | `true`（开启） |

涉及 JS 隔离开关时，统一用 Hooks API `loadApp({ scopeJs })` 精确控制。

**何时关闭**：子应用需直接读写主应用全局对象/共享单例；调试沙箱兼容问题时。关闭即失去隔离，谨慎使用。

## scopeCss · 样式隔离

开启后框架给子应用样式规则追加作用域限定（以容器 `id` 为锚点），样式只在子应用容器内生效。

```ts
await loadApp({ url, id: 'a', scopeCss: true });  // 开启（默认）
await loadApp({ url, id: 'b', scopeCss: false }); // 关闭
```

⚠️ **标签用法下不能通过 `scopeCss` 属性单独控制**，由是否启用 Shadow DOM 决定（`scopeCss = !setShadowDom`）：未开 Shadow DOM → `true`；开了 `setShadowDom` → `false`。要在不开 Shadow DOM 时关闭作用域改写，请用 Hooks `loadApp({ scopeCss: false })`。

| 隔离方式 | 原理 | 彻底性 | 兼容性 |
| --- | --- | --- | --- |
| `scopeCss`（作用域改写） | 给规则加容器前缀 | 中 | 好 |
| `setShadowDom` | 浏览器原生 Shadow 边界 | 高 | 视组件库对 Shadow DOM 的支持而定 |

## scopeLocation · 路由隔离（微应用专属）

开启后子应用拥有独立 `location`/`history`，路由跳转不改变主应用地址栏。机制：`scopeLocation` 为真（或模块型应用）时创建一个隐藏 iframe，子应用沙箱的 `location`/`history` 指向该 iframe 的 `contentWindow`。

```ts
await loadApp({ url, id: 'sub-spa', scopeJs: true, scopeLocation: true });
```

标签用法下按常规布尔属性解析（写了即开启）：`<bk-weweb ... scopeLocation></bk-weweb>`。

**何时启用**：子应用是用 `history` 路由的完整 SPA、不希望改主应用地址栏；主子各自独立路由栈。
**注意**：引入隐藏 iframe 有少量开销；hash 路由且无冲突通常无需开启；隔离后子应用读到的是 iframe 地址。

## setShadowDom · Shadow DOM

把子应用挂进 `mode:'open'` 的 ShadowRoot，获得浏览器原生样式与结构隔离。启用后不再做 CSS 作用域改写（`scopeCss = !setShadowDom`）。

```html
<bk-weweb id="app" url="http://localhost:8001/" setShadowDom></bk-weweb>
```

- 兼容历史拼写错误属性 `setShodowDom`（少一个 a），仅兼容保留，新代码用 `setShadowDom`。
- 已为 ShadowRoot 注入 `getBoundingClientRect` 兼容（代理到宿主），便于 ECharts 等图表库。

**注意**：依赖全局 `document` 选择器或不支持 Shadow DOM 的第三方库可能异常，此时回退到 `scopeCss`；主应用普通 `document.querySelector` 选不到 Shadow 内部节点（需经 `shadowRoot`）。

## keepAlive · 缓存模式

控制子应用"离开"时是否保留 DOM 与运行状态，类似 Vue `<keep-alive>`。需配合 `activated`/`deactivated` 才生效。

```ts
await loadApp({ url, id: 'list', keepAlive: true });
activated('list', containerEl);   // 进入
deactivated('list');              // 离开：保留状态
activated('list', containerEl);   // 再进入：秒级恢复，不重跑脚本
```

- `keepAlive: true` → `deactivated` 保留 DOM、置 `DEACTIVATED`；`activated` 转移节点恢复状态。
- `keepAlive: false` → `deactivated` 等价 `unmount`。
- 只用 `mount`/`unmount` 不会保留。常驻内存，不用时用 `unmount` + `unload` 释放。

## showSourceCode · 显示源码

控制脚本执行时是否保留源码信息便于 DevTools 调试。**微应用默认 `false`**，微模块默认 `true`。只影响脚本注入方式，不改变功能。开发联调时可开启。

## 基础属性

- **url（必填）**：入口 HTML 地址。改 `<bk-weweb>` 的 `url` 触发重新加载（唯一被监听的属性）。
- **id**：唯一标识/缓存键/挂载键，建议显式设置。
- **data**：传给子应用的数据；标签是 JSON 字符串，Hooks 直接传对象；子应用经 `window.__BK_WEWEB_DATA__` 读取。重新 `loadApp` 同 `id` 时新 `data` 覆盖旧值。
- **initSource**：额外需预加载的资源列表。

## 标签用法属性差异小结

| 属性 | 标签行为 | 想精确控制就用 Hooks |
| --- | --- | --- |
| `scopeJs` | **取反**（写了反而关闭） | `loadApp({ scopeJs })` |
| `scopeCss` | 由 `setShadowDom` 决定，不可单独设 | `loadApp({ scopeCss })` |
| `scopeLocation` / `setShadowDom` / `keepAlive` / `showSourceCode` | 常规布尔（写了即开启） | 同名参数 |
