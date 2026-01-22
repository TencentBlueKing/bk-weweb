# 微应用配置详解

## 目录

- [概述](#概述)
- [配置属性](#配置属性)
- [Web Component 方式](#web-component-方式)
- [Hooks API 方式](#hooks-api-方式)
- [完整配置示例](#完整配置示例)
- [GitHub 文档](#github-文档)

## 概述

微应用模式用于加载**独立部署的远程应用**（HTML Entry）。BK-WeWeb 通过解析微应用的 HTML 入口，自动提取 CSS 和 JavaScript 资源，在隔离环境中执行。

适用场景：

- 独立部署的子应用（有独立团队维护、独立上线部署）
- 技术栈异构（主应用 Vue，子应用 React）
- 渐进式迁移（老系统逐步迁移到新框架）
- 多应用聚合（多个独立系统集成到统一门户）

## 配置属性

| 属性           | 类型      | 默认值  | 必填 | 说明                         |
| -------------- | --------- | ------- | ---- | ---------------------------- |
| url            | `string`  | -       | 是   | 应用入口 URL                 |
| id             | `string`  | -       | 否   | 应用唯一标识符               |
| scopeJs        | `boolean` | `true`  | 否   | JS 沙箱隔离                  |
| scopeCss       | `boolean` | `true`  | 否   | CSS 样式隔离                 |
| scopeLocation  | `boolean` | `false` | 否   | 路由隔离（独立 history）     |
| setShadowDom   | `boolean` | `false` | 否   | Shadow DOM 模式              |
| keepAlive      | `boolean` | `false` | 否   | 缓存模式                     |
| showSourceCode | `boolean` | `false` | 否   | 显示源码                     |
| data           | `object`  | -       | 否   | 传递给子应用的数据           |
| initSource     | `array`   | -       | 否   | 初始化资源列表（CSS/JS URL） |

### 属性详解

#### scopeJs - JS 沙箱隔离

基于 ES6 Proxy 实现的沙箱环境：

- 子应用对 window 的修改不影响主应用
- 子应用之间的全局变量相互隔离
- 支持 document 代理，自动处理 DOM 操作

#### scopeCss - CSS 样式隔离

自动为子应用的 CSS 选择器添加作用域前缀：

```css
/* 原始样式 */
.header {
  color: red;
}

/* 处理后 */
#app-name .header {
  color: red;
}
```

#### scopeLocation - 路由隔离

为子应用提供独立的 Location 和 History 对象：

- 子应用路由变化不影响浏览器地址栏
- 多个子应用可以同时展示各自的路由页面

#### keepAlive - 缓存模式

开启后，应用卸载时保留 DOM 和状态，再次挂载时快速恢复。需配合 `activated/deactivated` 使用。

## Web Component 方式

```vue
<template>
  <bk-weweb
    id="child-app"
    url="http://localhost:8001/"
    :scope-js="true"
    :scope-css="true"
    :scope-location="false"
    :keep-alive="false"
    :data="JSON.stringify({ userId: '123' })"
  />
</template>

<script setup>
  import '@blueking/bk-weweb';
</script>
```

## Hooks API 方式

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载微应用
const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  scopeLocation: false,
  keepAlive: false,
  data: {
    userId: '123',
    token: 'xxx',
    config: { theme: 'dark' },
  },
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/common.css'],
});

// 挂载到容器
mount('my-app', document.getElementById('container'));

// 卸载应用
unmount('my-app');
```

## 完整配置示例

```typescript
await loadApp({
  // 必填
  url: 'http://localhost:8001/',

  // 标识符
  id: 'dashboard-app',

  // 隔离配置
  scopeJs: true, // 开启 JS 沙箱
  scopeCss: true, // 开启 CSS 隔离
  scopeLocation: true, // 开启路由隔离
  setShadowDom: false, // 不使用 Shadow DOM

  // 缓存配置
  keepAlive: true, // 开启缓存模式

  // 数据传递（保持对象引用）
  data: {
    userInfo: { id: 1, name: 'admin' },
    permissions: ['read', 'write'],
    eventBus: myEventBus, // 可传递函数/对象引用
  },

  // 预加载公共资源
  initSource: [
    'https://cdn.example.com/vue@3.0.0/vue.global.prod.js',
    'https://cdn.example.com/element-plus/index.css',
  ],
});
```

## GitHub 文档

详细文档请访问：

- [微应用概述](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/README.md)
- [url 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/url.md)
- [scopeJs 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/scope-js.md)
- [scopeCss 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/scope-css.md)
- [scopeLocation 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/scope-location.md)
- [keepAlive 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/keep-alive.md)
- [data 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-app/data.md)
