### 简介
---
`bk-weweb`是蓝鲸前端孵化的一款与市面上都不同的轻量可伸缩的微前端开发框架 

### 有哪些不同呢？
回答这个问题之前，我们先回顾一下使用微前端是为了做什么?

微前端并不是一个单纯的一个开发框架或者组件，而是一种前端的架构设计。

在前端发展前期 如果我们需要加载嵌入一个已经部署的应用通常我们想到的是使用iframe来嵌入实现
iframe是浏览器通用实现 内部做了一层完整安全的隔离 用于防护嵌入页面对主应用的上下文的安全等影响
但是因为这一层完全的隔离 也会带来很多体验上的不友好。
例如像 路由不能共享、前进、回退。还有像没有缓存 再次进入后不能回到历史页面并且还需要重新加载渲染一次等等体验问题

所以前端迫切需要一种类似iframe的能力的组件来完成上面提到的不足并能很好嵌入页面

这就有了我们现在的 微前端