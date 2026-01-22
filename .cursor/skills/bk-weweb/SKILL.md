---
name: bk-weweb
description: BK-WeWeb 微前端框架开发指南。在以下场景使用：(1) 从零开始接入 BK-WeWeb 微前端框架 (2) 创建微应用（HTML Entry）加载完整远程应用 (3) 创建微模块（JS Entry）加载远程组件/插件 (4) 生成 Vue/React 集成代码 (5) 配置 JS 沙箱、CSS 隔离、路由隔离、Shadow DOM (6) 使用 KeepAlive 缓存模式 (7) 配置预加载优化性能
---

# BK-WeWeb 微前端开发指南

BK-WeWeb 是腾讯蓝鲸开源的轻量级微前端框架，基于 Web Components，支持零侵入接入。

## 快速接入流程

```
1. 安装依赖 → npm install @blueking/bk-weweb
2. 引入框架 → import '@blueking/bk-weweb'
3. 选择模式 → 微应用(完整应用) 或 微模块(组件/插件)
4. 配置属性 → url、id、scopeJs、scopeCss 等
5. 挂载运行 → Web Component 标签 或 Hooks API
```

## 模式选择决策树

```
需要加载完整的独立应用？
├── 是 → 微应用（loadApp）
│       - 有完整 HTML 入口
│       - 独立部署和运行
│       - 需要路由隔离
│       → 详见 references/micro-app.md
│
└── 否 → 微模块（loadInstance）
        - 只需加载 JS 模块
        - 作为组件/插件使用
        - 需要获取导出实例
        → 详见 references/micro-module.md
```

## 微应用快速开始

### Web Component 方式

```vue
<template>
  <bk-weweb
    id="child-app"
    url="http://localhost:8001/"
    :scope-js="true"
    :scope-css="true"
  />
</template>

<script setup>
  import '@blueking/bk-weweb';
</script>
```

### Hooks API 方式

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载 → 挂载 → 卸载
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});

mount('my-app', document.getElementById('container'));
unmount('my-app');
```

**完整配置和属性详解** → 见 [references/micro-app.md](references/micro-app.md)

## 微模块快速开始

### Web Component 方式

```vue
<template>
  <bk-weweb
    id="chart-widget"
    mode="js"
    url="http://localhost:8002/widget.js"
    :scope-css="true"
  />
</template>
```

### Hooks API 方式

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  data: { type: 'chart' },
});

activated('my-module', container);
deactivated('my-module');
```

### 微模块 render 规范

```typescript
// widget.ts - 模块必须导出包含 render 方法的对象
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    container.innerHTML = `<div>Hello ${data.name}</div>`;
    return () => {
      container.innerHTML = '';
    }; // 返回销毁函数
  },
};
```

**完整配置、框架集成和构建配置** → 见 [references/micro-module.md](references/micro-module.md)

## 配置属性速查

| 属性          | 微应用默认 | 微模块默认 | 说明                   |
| ------------- | ---------- | ---------- | ---------------------- |
| url           | -          | -          | 入口 URL（必填）       |
| id            | -          | -          | 唯一标识符             |
| mode          | `'app'`    | `'js'`     | 运行模式               |
| scopeJs       | `true`     | `false`    | JS 沙箱隔离            |
| scopeCss      | `true`     | `true`     | CSS 样式隔离           |
| scopeLocation | `false`    | -          | 路由隔离（仅微应用）   |
| setShadowDom  | `false`    | -          | Shadow DOM（仅微应用） |
| keepAlive     | `false`    | `false`    | 缓存模式               |
| data          | -          | -          | 传递数据               |

## Hooks API 速查

```typescript
import {
  loadApp, // 加载微应用 → Promise<MicroAppModel>
  loadInstance, // 加载微模块 → Promise<MicroInstanceModel>
  mount, // 挂载应用
  unmount, // 卸载应用
  activated, // 激活（keepAlive 模式）
  deactivated, // 停用（keepAlive 模式）
  unload, // 删除缓存
  preLoadApp, // 预加载微应用
  preLoadInstance, // 预加载微模块
} from '@blueking/bk-weweb';
```

**完整 API 参考和生命周期流程** → 见 [references/hooks-api.md](references/hooks-api.md)

## 子应用环境检测

```typescript
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__; // 应用标识
  const data = window.__BK_WEWEB_DATA__; // 主应用传递的数据
  const realWindow = window.rawWindow; // 原始 window
}
```

## 常见问题速查

| 问题             | 解决方案                                             |
| ---------------- | ---------------------------------------------------- |
| 子应用加载失败   | 检查 CORS 配置，子应用需允许主应用域名跨域访问       |
| 样式冲突         | 确认 `scopeCss: true`，或使用 `setShadowDom: true`   |
| 路由不工作       | 开启 `scopeLocation: true` 实现路由隔离              |
| 需要传递复杂数据 | 使用 Hooks API 的 `data` 属性，保持对象引用          |
| 切换时状态丢失   | 开启 `keepAlive: true`，使用 `activated/deactivated` |
| 首屏加载慢       | 使用 `preLoadApp/preLoadInstance` 预加载             |

## 参考文档

按需加载以下详细文档：

| 文档                                                     | 何时使用                     |
| -------------------------------------------------------- | ---------------------------- |
| [references/micro-app.md](references/micro-app.md)       | 需要微应用配置详解           |
| [references/micro-module.md](references/micro-module.md) | 需要微模块配置和 render 规范 |
| [references/hooks-api.md](references/hooks-api.md)       | 需要完整 Hooks API 参考      |

## GitHub 文档

- [简介](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/getting-started/introduction.md)
- [快速上手](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/getting-started/quick-start.md)
- [API 参考](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/api/README.md)

## 浏览器支持

Chrome 67+ / Firefox 63+ / Safari 10.1+ / Edge 79+（不支持 IE）
