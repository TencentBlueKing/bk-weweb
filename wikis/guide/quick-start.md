# 快速开始

本章带你在主应用中加载并挂载第一个微应用。

## 安装

::: code-group

```bash [npm]
npm install @blueking/bk-weweb
```

```bash [yarn]
yarn add @blueking/bk-weweb
```

```bash [pnpm]
pnpm add @blueking/bk-weweb
```

:::

## 在主应用中引入

在主应用入口处引入一次。导入这个包会自动把自定义元素 `bk-weweb` 注册到 `window.customElements` 中。

```ts
// main.ts
import '@blueking/bk-weweb';
```

如果需要自定义启动行为（如共享主应用资源、修改标签名、自定义资源请求），调用默认导出的 `start`：

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true, // 收集主应用资源供子应用复用
});
```

## 方式一：Web Component 标签

最简单的用法——直接在模板里写一个 `<bk-weweb>` 标签，框架会自动加载并挂载。

```html
<!-- 微应用：入口是一个 HTML 地址 -->
<bk-weweb
  id="child-app"
  url="http://localhost:8001/"
  scopeJs
  scopeCss
></bk-weweb>

<!-- 微模块：入口是一个 JS 地址，需显式 mode="js" -->
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
></bk-weweb>
```

> `<bk-weweb>` 只监听 `url` 属性的变化。修改 `url` 会触发重新加载；其余属性在元素连接（`connectedCallback`）时读取。

::: warning scopeJs 陷阱（微应用标签用法）
微应用**标签用法**下 `scopeJs` 的取值被取反：不写该属性时沙箱**默认开启**，而写了 `scopeJs` 反而会**关闭**沙箱。需要精确控制 JS 隔离时，请使用下面的 Hooks API（`loadApp({ scopeJs })`）。详见 [scopeJs](../micro-app/scope-js)。
:::

## 方式二：Hooks API（编程式）

当你需要更精细地控制加载与挂载时机（例如路由切换时才挂载），使用 Hooks API：

```ts
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 1. 加载（拉取并解析资源，但不渲染）
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123', token: 'xxx' },
});

// 2. 挂载到容器
mount('my-app', document.getElementById('container')!);

// 3. 卸载
unmount('my-app');
```

`loadApp` 与 `mount` 分离的设计，使得你可以提前 [预加载](../advanced/preload)，在需要时再挂载，从而获得更快的切换体验。

## 该用哪种？

| | Web Component 标签 | Hooks API |
| --- | --- | --- |
| 风格 | 声明式 | 命令式 |
| 生命周期 | 连接/断开自动加载卸载（固定流程） | 自己编排每个时机 |
| 适用 | "放在哪渲染在哪"的简单场景 | 预加载、懒挂载、KeepAlive、容器复用等自定义场景 |
| 属性语义 | 部分布尔属性解析有特殊规则（如 scopeJs 取反） | 参数语义直观、可预期 |

经验法则：**简单嵌入用标签，需要任何非标准时序或精确隔离控制就用 Hooks**。二者共享同一份缓存，可混用。想了解 Hooks 能编排出哪些场景，见 [组合与自定义场景](../hooks/compose)。

## 子应用需要做什么

子应用通常**无需改造**即可被加载。如需感知运行环境或读取主应用传入的数据，可通过全局变量：

```ts
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__; // 当前应用标识
  const data = window.__BK_WEWEB_DATA__;      // 主应用通过 data 传入的数据
}
```

更多见 [全局变量](../api/global-variables)。若子应用使用 Vite 开发，建议接入 [Vite 插件](../advanced/vite-plugin) 以正确注入沙箱全局变量。

## 下一步

- 微应用各项能力：[微应用配置](../micro-app/)
- 微模块与 `render` 规范：[微模块配置](../micro-module/)
- 生命周期方法：[Hooks 概览](../hooks/)
