---
layout: home

hero:
  name: BK-WeWeb
  text: 轻量级微前端框架
  tagline: 基于 Web Components，开箱即用的微应用与微模块加载、隔离与通信能力
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: Hooks 组合场景
      link: /hooks/compose
    - theme: alt
      text: 什么是 BK-WeWeb？
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/TencentBlueKing/bk-weweb

features:
  - icon: 🧩
    title: 基于 Web Components
    details: 以原生自定义元素 <bk-weweb> 作为容器，无侵入接入任意技术栈，也提供 Hooks API 编程式加载。
  - icon: 🎯
    title: 双模式
    details: 微应用（app）加载完整远程应用，微模块（js）加载远程 JS 模块，覆盖整页接入与组件级复用两类场景。
  - icon: 🛡️
    title: JS 沙箱隔离
    details: 通过 Proxy 代理 window / document，配合 iframe 提供 location 隔离，避免子应用污染主应用全局环境。
  - icon: 🎨
    title: CSS 样式隔离
    details: 自动改写样式作用域，支持 Shadow DOM 彻底隔离，杜绝主子应用样式相互覆盖。
  - icon: 🧰
    title: Hooks 自由编排
    details: load / mount / activated 等正交原子能力共享同一份缓存，可像搭积木一样组合出预加载、KeepAlive、命令式更新、热更新等任意场景。
    link: /hooks/compose
    linkText: 查看组合场景
  - icon: ⚡
    title: 预加载
    details: preLoadApp / preLoadInstance / preLoadSource 利用浏览器空闲时间预取资源，需要时秒级挂载。
  - icon: 💾
    title: KeepAlive 缓存
    details: 切换时保留子应用 DOM 与运行状态，配合 activated / deactivated 实现类似 keep-alive 的体验。
---
