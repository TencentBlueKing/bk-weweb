---
name: bk-weweb
description: BK-WeWeb 微前端框架开发指南。在以下场景使用：(1) 构建微前端架构，将多个独立应用集成到一个主应用 (2) 使用 <bk-weweb> Web Component 或 Hooks API 加载远程应用 (3) 加载微应用(HTML Entry)或微模块(JS Module) (4) 配置 JS 沙箱、CSS 隔离、路由隔离 (5) 使用 Shadow DOM 或 KeepAlive 缓存模式 (6) 在 Vue/React 中集成微前端 (7) 配置预加载优化首屏性能。本 skill 配套 MCP server 提供文档查询和代码生成工具。
---

# BK-WeWeb 微前端开发指南

BK-WeWeb 是腾讯蓝鲸开源的轻量级微前端框架，基于 Web Components，支持零侵入接入。

## 核心概念

| 概念     | 说明                                                      |
| -------- | --------------------------------------------------------- |
| 微应用   | 加载完整 HTML 应用（HTML Entry），适合独立部署的子应用    |
| 微模块   | 加载 JS 模块（JS Entry），适合远程组件、插件系统          |
| 隔离     | JS 沙箱（Proxy）、CSS 作用域、路由隔离（独立 location）   |
| 生命周期 | load → mount → activated ⟷ deactivated → unmount → unload |

## 使用场景

### 选择微应用的场景

| 场景           | 说明                                     |
| -------------- | ---------------------------------------- |
| 独立部署子应用 | 有独立团队维护、独立上线部署的完整应用   |
| 技术栈异构     | 主应用 Vue，子应用 React；或不同框架版本 |
| 渐进式迁移     | 老系统逐步迁移到新框架，保留原有应用     |
| 多应用聚合     | 将多个独立系统集成到统一门户             |

### 选择微模块的场景

| 场景       | 说明                                    |
| ---------- | --------------------------------------- |
| 跨框架组件 | 在 Vue3 中使用 Vue2 组件，或 React 组件 |
| 插件系统   | 用户自定义插件、第三方插件动态加载      |
| 远程组件   | 根据配置动态加载不同组件                |
| 仪表盘微件 | 仪表盘中的图表、表格、地图等独立微件    |
| 低代码平台 | 动态加载渲染器、自定义组件              |

### 如何选择

```
需要加载完整的独立应用？
├── 是 → 微应用（loadApp）
│       - 有完整 HTML 入口
│       - 独立部署和运行
│       - 需要路由隔离
└── 否 → 微模块（loadInstance）
        - 只需加载 JS 模块
        - 作为组件/插件使用
        - 需要获取导出实例
```

## 快速开始

```bash
npm install @blueking/bk-weweb
```

### 方式一：Web Component（推荐简单场景）

```vue
<template>
  <!-- 微应用 -->
  <bk-weweb
    id="app-1"
    url="http://localhost:8001/"
  />

  <!-- 微模块 -->
  <bk-weweb
    id="module-1"
    mode="js"
    url="http://localhost:8002/widget.js"
  />
</template>

<script setup>
  import '@blueking/bk-weweb';
</script>
```

### 方式二：Hooks API（推荐复杂场景）

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载微应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123', config: { theme: 'dark' } }, // 保持对象引用
});

// 挂载到容器
mount('my-app', document.getElementById('container'));

// 卸载
unmount('my-app');
```

## 配置属性速查

| 属性          | 类型    | 默认值 | 微应用 | 微模块 | 说明                     |
| ------------- | ------- | ------ | ------ | ------ | ------------------------ |
| url           | string  | -      | ✅     | ✅     | 入口 URL（必填）         |
| id            | string  | -      | ✅     | ✅     | 唯一标识符               |
| mode          | string  | 'app'  | -      | ✅     | 微模块需设为 'js'        |
| scopeJs       | boolean | true   | ✅     | ✅     | JS 沙箱隔离              |
| scopeCss      | boolean | true   | ✅     | ✅     | CSS 样式隔离             |
| scopeLocation | boolean | false  | ✅     | -      | 路由隔离（独立 history） |
| setShadowDom  | boolean | false  | ✅     | -      | Shadow DOM 模式          |
| keepAlive     | boolean | false  | ✅     | ✅     | 缓存模式                 |
| data          | object  | -      | ✅     | ✅     | 传递给子应用的数据       |

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

## 子应用环境检测

```typescript
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__; // 应用标识
  const data = window.__BK_WEWEB_DATA__; // 主应用传递的数据
  const realWindow = window.rawWindow; // 原始 window（沙箱环境）
}
```

## 微模块 render 规范

微模块需导出包含 `render` 方法的对象：

```typescript
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 渲染逻辑
    return () => {
      /* 销毁清理 */
    };
  },
  // 可选：导出其他方法供主应用调用
  update(newData) {
    /* ... */
  },
  getState() {
    return {
      /* ... */
    };
  },
};
```

## MCP 工具

本 skill 配套 MCP server 提供以下工具，直接调用即可：

| 工具                         | 用途                                          |
| ---------------------------- | --------------------------------------------- |
| `get_bk_weweb_docs`          | 获取文档（topic: introduction/micro-app/...） |
| `get_api_reference`          | 获取 API 文档（api_name: loadApp/mount/...）  |
| `generate_micro_app_code`    | 生成微应用代码                                |
| `generate_micro_module_code` | 生成微模块代码                                |
| `generate_vue_integration`   | 生成 Vue 3 集成代码                           |
| `generate_react_integration` | 生成 React 集成代码                           |
| `get_example_code`           | 获取示例代码（scenario: keep-alive/...）      |
| `validate_weweb_config`      | 校验配置                                      |
| `get_cors_config`            | 获取 CORS 配置指南                            |

## 参考文档

按需加载以下详细指南：

| 文档                                                        | 何时使用                |
| ----------------------------------------------------------- | ----------------------- |
| [vue-integration.md](references/vue-integration.md)         | Vue 3 项目集成微前端    |
| [react-integration.md](references/react-integration.md)     | React 项目集成微前端    |
| [micro-app-config.md](references/micro-app-config.md)       | 需要了解微应用配置细节  |
| [micro-module-config.md](references/micro-module-config.md) | 需要了解微模块配置细节  |
| [hooks-api.md](references/hooks-api.md)                     | 需要 Hooks API 完整用法 |
| [troubleshooting.md](references/troubleshooting.md)         | 遇到问题时排查          |

## 常见问题速查

| 问题             | 快速解决                                                |
| ---------------- | ------------------------------------------------------- |
| 子应用加载失败   | 检查 CORS 配置，调用 `get_cors_config` 工具获取配置指南 |
| 样式冲突         | 确认 `scopeCss: true`，或使用 `setShadowDom: true`      |
| 路由不工作       | 开启 `scopeLocation: true`                              |
| 需要传递复杂数据 | 使用 Hooks API 的 `data` 属性，保持对象引用             |
| 切换时状态丢失   | 开启 `keepAlive: true`，使用 `activated/deactivated`    |
| 首屏加载慢       | 使用 `preLoadApp/preLoadInstance` 预加载                |

## 浏览器支持

Chrome 67+ / Firefox 63+ / Safari 10.1+ / Edge 79+（不支持 IE）
