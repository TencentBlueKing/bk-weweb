# BK-WeWeb 文档中心

欢迎使用 BK-WeWeb 微前端框架文档。

## 文档目录

### 开始

- [简介](./getting-started/introduction.md) - 了解 BK-WeWeb 是什么
- [快速上手](./getting-started/quick-start.md) - 5 分钟快速接入指南

### 基础

#### 微应用

- [微应用概述](./basic/micro-app/README.md) - 微应用模式介绍
- [id 属性](./basic/micro-app/id.md) - 应用唯一标识符
- [url 属性](./basic/micro-app/url.md) - 应用入口地址
- [mode 属性](./basic/micro-app/mode.md) - 运行模式配置
- [scopeJs 属性](./basic/micro-app/scope-js.md) - JS 沙箱隔离
- [scopeCss 属性](./basic/micro-app/scope-css.md) - CSS 样式隔离
- [scopeLocation 属性](./basic/micro-app/scope-location.md) - 路由隔离
- [setShadowDom 属性](./basic/micro-app/set-shadow-dom.md) - Shadow DOM 模式
- [keepAlive 属性](./basic/micro-app/keep-alive.md) - 缓存模式
- [showSourceCode 属性](./basic/micro-app/show-source-code.md) - 源码显示
- [data 属性](./basic/micro-app/data.md) - 数据传递
- [initSource 属性](./basic/micro-app/init-source.md) - 初始化资源

#### 微模块

- [微模块概述](./basic/micro-module/README.md) - 微模块模式介绍
- [id 属性](./basic/micro-module/id.md) - 模块唯一标识符
- [url 属性](./basic/micro-module/url.md) - 模块入口地址
- [mode 属性](./basic/micro-module/mode.md) - 运行模式配置
- [scopeJs 属性](./basic/micro-module/scope-js.md) - JS 沙箱隔离
- [scopeCss 属性](./basic/micro-module/scope-css.md) - CSS 样式隔离
- [keepAlive 属性](./basic/micro-module/keep-alive.md) - 缓存模式
- [showSourceCode 属性](./basic/micro-module/show-source-code.md) - 源码显示
- [data 属性](./basic/micro-module/data.md) - 数据传递
- [initSource 属性](./basic/micro-module/init-source.md) - 初始化资源
- [render 规范](./basic/micro-module/render-specification.md) - 模块导出规范

#### Hooks

- [Hooks 概述](./basic/hooks/README.md) - Hooks API 介绍
- [load](./basic/hooks/load.md) - 统一加载入口
- [loadApp](./basic/hooks/load-app.md) - 加载微应用
- [loadInstance](./basic/hooks/load-instance.md) - 加载微模块
- [mount](./basic/hooks/mount.md) - 挂载应用
- [unmount](./basic/hooks/unmount.md) - 卸载应用
- [unload](./basic/hooks/unload.md) - 删除缓存
- [activated](./basic/hooks/activated.md) - 激活应用
- [deactivated](./basic/hooks/deactivated.md) - 停用应用

### 深入使用

- [自定义微应用](./advanced/custom-micro-app.md) - 创建自定义微应用容器
- [自定义微模块](./advanced/custom-micro-module.md) - 创建自定义微模块容器
- [预加载](./advanced/preload.md) - 资源预加载策略

### API

- [API 概述](./api/README.md) - API 总览
- [WeWeb 类](./api/weweb-class.md) - 主入口类
- [类型定义](./api/types.md) - TypeScript 类型
- [全局变量](./api/global-variables.md) - 子应用全局变量

---

## 版本信息

当前版本：**0.0.37**

## 相关链接

- [GitHub 仓库](https://github.com/TencentBlueKing/bk-weweb)
- [NPM 包](https://www.npmjs.com/package/@blueking/bk-weweb)
- [更新日志](../CHANGELOG.md)
