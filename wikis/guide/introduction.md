# 介绍

BK-WeWeb 是腾讯蓝鲸（BlueKing）团队开源的**轻量级微前端框架**。它以浏览器原生的 [Web Components](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components) 为基础，通过一个自定义元素 `<bk-weweb>` 把远程应用或远程 JS 模块加载、隔离并渲染到主应用的任意容器中。

```bash
npm install @blueking/bk-weweb
```

## 为什么需要微前端

当一个 Web 系统由多个团队、多种技术栈（Vue 2 / Vue 3 / React / Angular ...）共同维护，或需要把一个独立部署的子系统嵌入到主系统时，传统的 iframe 接入存在通信困难、样式割裂、路由不同步等问题。微前端的目标是：

- 让子应用**独立开发、独立部署**，又能在运行时被主应用**按需加载**；
- 子应用之间、子应用与主应用之间做到 **JS 与 CSS 隔离**，互不污染；
- 主子应用之间可以**传递数据、共享资源**。

## BK-WeWeb 的特点

- **基于 Web Components**：容器即一个标准自定义元素 `<bk-weweb>`，天然跨框架；同时提供 `loadApp` / `mount` 等 Hooks API 用于编程式加载。
- **两种运行模式**：
  - **微应用（app）**：加载一个完整的远程应用（入口是 HTML）。
  - **微模块（js）**：加载一个远程 JS 模块（入口是 JS），按 `render` 规范渲染，适合远程组件、插件。
- **JS 沙箱**：通过 `Proxy` 代理 `window` / `document`，子应用对全局对象的读写被收敛到独立沙箱；开启 `scopeLocation` 时还会借助隐藏 iframe 隔离 `location` / `history`。
- **CSS 隔离**：自动为子应用样式追加作用域前缀，或使用 Shadow DOM 实现彻底隔离。
- **预加载**：在浏览器空闲时（`requestIdleCallback`）提前拉取子应用资源，需要时秒级挂载。
- **KeepAlive**：切换时保留子应用 DOM 与运行状态，配合 `activated` / `deactivated` 复用实例。

## 与同类框架的简单对比

| 维度 | BK-WeWeb | qiankun | micro-app |
| --- | --- | --- | --- |
| 容器形态 | 原生 Web Component `<bk-weweb>` | JS API 注册 | 自定义元素 `<micro-app>` |
| 加载粒度 | 微应用 + 微模块（JS 模块） | 微应用 | 微应用 |
| JS 隔离 | Proxy 沙箱（+ iframe location） | Proxy / 快照沙箱 | Proxy + iframe |
| CSS 隔离 | 作用域改写 / Shadow DOM | 实验性 Shadow DOM | 作用域 / Shadow DOM |

> 该对比仅用于快速建立认知，具体能力以各框架最新版本为准。

## 下一步

- 跟随 [快速开始](./quick-start) 在几分钟内跑通第一个微应用。
- 阅读 [核心概念](./concepts) 理解两种模式与两种使用方式。
