---
name: bk-weweb
description: 腾讯蓝鲸 BK-WeWeb（@blueking/bk-weweb）微前端框架使用指南。当用户在自己的项目中安装或使用 @blueking/bk-weweb、需要加载微应用/微模块、配置 JS 沙箱或 CSS 隔离、做主子应用通信、预加载、KeepAlive、Vite 集成，或询问 bk-weweb / <bk-weweb> 标签相关问题时使用。
---

# BK-WeWeb 微前端框架使用指南

BK-WeWeb 是腾讯蓝鲸开源的轻量级微前端框架，基于 Web Components，把远程应用或远程 JS 模块加载、隔离、渲染到主应用容器中。包名：`@blueking/bk-weweb`。

本指南面向**在自己的项目中集成 bk-weweb 的开发者**。先读本页建立正确心智并避开高频坑，需要某主题细节时再按需读对应 `references/` 文件。

## 安装与启动

```bash
npm install @blueking/bk-weweb   # 或 yarn add / pnpm add
```

在主应用入口**引入一次**。导入这个包会自动把自定义元素 `bk-weweb` 注册到 `window.customElements`：

```ts
// main.ts
import '@blueking/bk-weweb';
```

需要全局配置时调用默认导出的 `start()`（可选）：

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true,        // 收集主应用资源供子应用复用
  // webComponentTag: 'micro-frame', // 自定义元素标签名
  // fetchSource: async (url, options) => (await fetch(url, options)).text(),
});
```

## 两种运行模式

| 模式 | `mode` 值 | 入口 | 渲染方式 | 适用 |
| --- | --- | --- | --- | --- |
| **微应用** | `app`（默认，可省略） | HTML | 解析 HTML，执行其 script/style，渲染进容器 | 独立部署的完整应用、整页接入 |
| **微模块** | `js`（**必填**） | JS | 执行 JS，调用导出对象的 `render(container, data)` | 远程组件、图表、插件 |

> 不写 `mode` 默认按微应用处理；微模块必须显式 `mode="js"`，否则会被当作微应用而加载失败。

## 两种使用方式

同一套能力有两种调用方式，共享同一份缓存（以 `id`/`url` 为键），可混用。

**方式一：Web Component 标签（声明式）** — 连接到 DOM 自动加载挂载，移出自动卸载。适合"放在哪渲染在哪"的简单场景。

```html
<bk-weweb id="child-app" url="http://localhost:8001/"></bk-weweb>
<bk-weweb id="chart" mode="js" url="http://localhost:8002/widget.js"></bk-weweb>
```

**方式二：Hooks API（命令式）** — 精确控制每个时机。适合预加载、懒挂载、KeepAlive、容器复用等。

```ts
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

await loadApp({ url: 'http://localhost:8001/', id: 'my-app', scopeJs: true, scopeCss: true });
mount('my-app', document.getElementById('container')!);
unmount('my-app');
```

**经验法则：简单嵌入用标签；需要任何非标准时序、精确隔离控制、或多框架编程式集成，就用 Hooks API。** 标签对部分布尔属性有特殊解析规则（见下），Hooks 参数语义直观可预期，**推荐优先用 Hooks API**。

## ⚠️ 高频陷阱（务必先看）

这些是 LLM / 开发者最容易写错的地方：

1. **微应用标签上的 `scopeJs` 语义被取反**（源码 `scopeJs: !getBooleanAttr('scopeJs')`）：
   - 不写 `scopeJs` → 沙箱**开启**（默认）
   - 写 `scopeJs` 或 `scopeJs="true"` → 沙箱**关闭**
   - 想精确控制 JS 隔离，请用 Hooks `loadApp({ scopeJs: false })`，不要用标签。
   - 注意：微模块标签的 `scopeJs` **不取反**（按常规布尔属性解析）。

2. **微应用标签上的 `scopeCss` 不能单独控制**：由是否启用 Shadow DOM 决定（`scopeCss = !setShadowDom`）。要在不开 Shadow DOM 时关闭样式作用域，请用 Hooks `loadApp({ scopeCss: false })`。

3. **微应用 vs 微模块默认值不同**，别记混：

   | 属性 | 微应用默认 | 微模块默认 |
   | --- | --- | --- |
   | `scopeJs` | `true` | `true` |
   | `scopeCss` | `true` | `true` |
   | `scopeLocation` | `false` | （微应用专属） |
   | `setShadowDom` | `false` | `false` |
   | `keepAlive` | `false` | `false` |
   | `showSourceCode` | **`false`** | **`true`** |

4. **`<bk-weweb>` 只监听 `url` 属性变化**（`observedAttributes`）：改 `url` 会重新加载，改其它属性不会在连接后生效。

5. **`mount` / `activated` 是异步的**（内部经 `nextTask` 微任务执行），不要假设调用后同步完成渲染；需要挂载完成后做事请用回调参数。

6. **先 `await loadApp`/`loadInstance` 再 `mount`**：未加载就 `mount` 会静默无效。

7. **微模块必须导出含 `render(container, data)` 的对象**，否则挂载后无内容。框架**不会**使用 `render` 的返回值做清理——清理方法需自行导出（如 `destroy`）并在卸载前调用。

8. **Vite 子应用必须接插件**：`dev` 模式以 ESM 运行，需在子应用 `vite.config.ts` 接入 `@blueking/bk-weweb/vite/helper`，且 `appKey` 与主应用加载的 `id` 一致。

9. **子应用资源必须允许跨域（CORS）**：框架用 `fetch` 拉取 HTML/JS，跨域被拦截会"静默白屏"（内部请求失败兜底返回空字符串而非抛错）。

## 快速示例

### 加载微应用（HTML 入口）

```ts
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123', token: 'xxx' }, // 传给子应用
});
mount('my-app', document.getElementById('container')!);
// 卸载：unmount('my-app');
```

### 加载微模块（JS 入口）

```ts
import { loadInstance, mount } from '@blueking/bk-weweb';

await loadInstance({ url: 'http://localhost:8002/widget.js', id: 'chart', data: { theme: 'dark' } });
mount('chart', document.getElementById('box')!, (_inst, api) => {
  // api 即模块导出对象，可命令式调用其方法
  api?.update?.({ value: 100 });
});
```

远程模块（`widget.js`）需遵循 render 规范：

```ts
let root;
export default {
  render(container, data) { root = createMyApp(container, data); }, // 必须
  update(d) { root?.setData(d); },   // 可选：供主应用调用
  destroy() { root?.unmount(); },    // 可选：清理，卸载前由主应用调用
};
```

## 主子应用通信（速览）

| 方向 | 方式 |
| --- | --- |
| 主 → 子 | `data`（标签是 JSON 字符串 / Hooks 直接传对象）→ 子应用读 `window.__BK_WEWEB_DATA__` |
| 子 → 主 / 主 ↔ 模块 | 微模块导出对象上的方法，通过 `mount` 回调第二参数获取并调用 |
| 主 ↔ 子全局通道 | 真实 `window`（子应用经 `window.rawWindow` 访问），谨慎使用 |

子应用感知环境：

```ts
if (window.__POWERED_BY_BK_WEWEB__) {
  const data = window.__BK_WEWEB_DATA__ ?? {};
  const realWindow = window.rawWindow || window; // 沙箱开启时 window 是代理
}
```

详见 [references/api.md](references/api.md) 与 [references/micro-module.md](references/micro-module.md)。

## 三种"卸载"的区别

| 方法 | 清空容器 | 失活沙箱 | 删除缓存 | 用途 |
| --- | --- | --- | --- | --- |
| `unmount(id)` | ✅ | ✅ | ❌ | 普通卸载，资源缓存保留可复用 |
| `deactivated(id)` | 视 `keepAlive`（true 则保留） | ✅ | ❌ | KeepAlive 切换 |
| `unload(url)` | ❌ | ❌ | ✅ | 强制释放/重载（传**缓存键**，微应用即 `url`） |

强制热更新子应用：先 `unmount(id)` → `unload(url)` → 重新 `loadApp` → `mount`。

## 按需深入（references）

| 主题 | 文件 |
| --- | --- |
| 微应用全部属性详解（scopeJs/scopeCss/scopeLocation/shadowDom/keepAlive/showSourceCode）与标签陷阱 | [references/micro-app.md](references/micro-app.md) |
| 微模块、render 导出规范、命令式更新、多实例 | [references/micro-module.md](references/micro-module.md) |
| 生命周期 Hooks 全签名、预加载、KeepAlive、组合场景 | [references/hooks.md](references/hooks.md) |
| Vue3 / Vue2 / React / Angular / Vite 集成与子应用改造 | [references/integration.md](references/integration.md) |
| `start` 配置、全局变量、关键类型定义、通信详解、FAQ | [references/api.md](references/api.md) |

## 包导出一览

```ts
import weWeb, {
  load, loadApp, loadInstance,            // 加载
  mount, unmount, activated, deactivated, unload, // 生命周期
  preLoadApp, preLoadInstance, preLoadSource,     // 预加载
  WewebMode,                              // 枚举：APP='app' / CONFIG='config' / INSTANCE='js'
  type IAppModelProps, type IJsModelProps, type BaseModel,
} from '@blueking/bk-weweb';

import wewebVitePlugin from '@blueking/bk-weweb/vite/helper'; // 子应用 Vite 插件
```
