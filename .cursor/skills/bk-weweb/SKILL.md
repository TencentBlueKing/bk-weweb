---
name: bk-weweb
description: 蓝鲸 BK-WeWeb 微前端框架使用指南。帮助用户使用 bk-weweb 实现微应用和微模块的加载、隔离和通信。当用户询问微前端、bk-weweb、子应用加载、JS沙箱、CSS隔离、预加载或需要创建微前端应用时使用此 skill。
---

# BK-WeWeb 微前端框架

BK-WeWeb 是腾讯蓝鲸团队开源的轻量级微前端框架，基于 Web Components 技术，支持微应用和微模块两种模式。

## 快速开始

### 安装

```bash
npm install @blueking/bk-weweb
```

### 在主应用中引入

```typescript
// main.ts
import '@blueking/bk-weweb';
```

## 两种运行模式

| 模式             | 说明             | 入口类型 | 适用场景           |
| ---------------- | ---------------- | -------- | ------------------ |
| **微应用 (app)** | 加载完整远程应用 | HTML     | 独立部署的完整应用 |
| **微模块 (js)**  | 加载远程 JS 模块 | JS       | 远程组件、插件系统 |

## 基础用法

### Web Component 标签方式

```vue
<template>
  <!-- 微应用 -->
  <bk-weweb
    id="child-app"
    url="http://localhost:8001/"
    :scope-js="true"
    :scope-css="true"
  />

  <!-- 微模块 -->
  <bk-weweb
    id="chart-module"
    mode="js"
    url="http://localhost:8002/widget.js"
  />
</template>
```

### Hooks API 方式

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载并挂载微应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123', token: 'xxx' },
});
mount('my-app', document.getElementById('container'));

// 卸载
unmount('my-app');
```

## 核心 API

### 生命周期 Hooks

| API                                       | 说明                                           |
| ----------------------------------------- | ---------------------------------------------- |
| `loadApp(props)`                          | 加载微应用，返回 `Promise<MicroAppModel>`      |
| `loadInstance(props)`                     | 加载微模块，返回 `Promise<MicroInstanceModel>` |
| `mount(appKey, container?, callback?)`    | 挂载到容器                                     |
| `unmount(appKey)`                         | 卸载应用/模块                                  |
| `activated(appKey, container, callback?)` | 激活（用于 keepAlive 模式）                    |
| `deactivated(appKey)`                     | 停用（用于 keepAlive 模式）                    |
| `unload(url)`                             | 删除缓存                                       |

### 预加载 Hooks

| API                         | 说明           |
| --------------------------- | -------------- |
| `preLoadApp(options)`       | 预加载微应用   |
| `preLoadInstance(options)`  | 预加载微模块   |
| `preLoadSource(sourceList)` | 预加载资源文件 |

### 启动配置

```typescript
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true, // 收集主应用资源供子应用共享
  webComponentTag: 'my-micro-app', // 自定义标签名
  fetchSource: async (url, options) => {
    // 自定义资源获取（如添加认证头）
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.text();
  },
});
```

## 配置属性速查

### 微应用属性 (mode="app" 或默认)

| 属性             | 类型            | 默认值  | 说明                   |
| ---------------- | --------------- | ------- | ---------------------- |
| `url`            | `string`        | -       | **必填**，应用入口 URL |
| `id`             | `string`        | -       | 应用唯一标识符         |
| `scopeJs`        | `boolean`       | `true`  | JS 沙箱隔离            |
| `scopeCss`       | `boolean`       | `true`  | CSS 样式隔离           |
| `scopeLocation`  | `boolean`       | `false` | 路由隔离               |
| `setShadowDom`   | `boolean`       | `false` | 使用 Shadow DOM        |
| `keepAlive`      | `boolean`       | `false` | 缓存模式               |
| `showSourceCode` | `boolean`       | `false` | 显示源码               |
| `data`           | `object/string` | -       | 传递数据               |
| `initSource`     | `string[]`      | -       | 初始化资源             |

### 微模块属性 (mode="js")

| 属性             | 类型            | 默认值  | 说明                   |
| ---------------- | --------------- | ------- | ---------------------- |
| `url`            | `string`        | -       | **必填**，JS 模块 URL  |
| `id`             | `string`        | -       | **必填**，模块唯一标识 |
| `mode`           | `'js'`          | -       | **必填**，设为 `'js'`  |
| `scopeJs`        | `boolean`       | `false` | JS 沙箱隔离            |
| `scopeCss`       | `boolean`       | `true`  | CSS 样式隔离           |
| `keepAlive`      | `boolean`       | `false` | 缓存模式               |
| `showSourceCode` | `boolean`       | `true`  | 显示源码               |
| `data`           | `object/string` | -       | 传递数据               |

## 子应用开发

### 全局变量

子应用中可通过以下全局变量获取运行时信息：

```typescript
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__; // 应用标识
  const data = window.__BK_WEWEB_DATA__; // 主应用传递的数据
  const realWindow = window.rawWindow; // 原始 window
  const realDocument = window.rawDocument; // 原始 document
}
```

### 微模块 render 规范

微模块需导出包含 `render` 方法的对象：

```typescript
// widget.js
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    container.innerHTML = `<div>Hello ${data.name}</div>`;

    // 返回销毁函数
    return () => {
      container.innerHTML = '';
    };
  },

  // 可选：其他方法供主应用调用
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

## 框架集成示例

### Vue 3

```vue
<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadApp, mount, unmount } from '@blueking/bk-weweb';

  const containerRef = ref<HTMLElement>();
  const appId = 'child-app';

  onMounted(async () => {
    await loadApp({
      url: 'http://localhost:8001/',
      id: appId,
      scopeJs: true,
      scopeCss: true,
      data: { userId: '123' },
    });
    mount(appId, containerRef.value!);
  });

  onBeforeUnmount(() => unmount(appId));
</script>

<template>
  <div
    ref="containerRef"
    class="app-container"
  ></div>
</template>
```

### React

```tsx
import { useRef, useEffect } from 'react';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

const MicroApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appId = 'child-app';

  useEffect(() => {
    const load = async () => {
      await loadApp({
        url: 'http://localhost:8001/',
        id: appId,
        scopeJs: true,
        scopeCss: true,
      });
      if (containerRef.current) {
        mount(appId, containerRef.current);
      }
    };
    load();
    return () => unmount(appId);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: '600px' }}
    />
  );
};
```

## 预加载策略

```typescript
import { preLoadApp, mount } from '@blueking/bk-weweb';

// 页面加载完成后预加载
window.addEventListener('load', () => {
  setTimeout(() => {
    preLoadApp({
      url: 'http://localhost:8001/',
      id: 'dashboard',
      scopeJs: true,
    });
  }, 2000); // 延迟避免影响首屏
});

// 需要时直接挂载（无需等待加载）
function showDashboard() {
  mount('dashboard', document.getElementById('container'));
}
```

## 常见问题

### 1. 子应用加载失败

- 检查 CORS 配置，确保允许跨域
- 检查 URL 是否正确
- 查看控制台错误信息

### 2. 样式冲突

- 确认 `scopeCss` 已开启
- 考虑使用 `setShadowDom` 获得更彻底隔离
- 检查是否使用了 `!important`

### 3. 子应用路由不工作

- 开启 `scopeLocation` 实现路由隔离
- 确认路由模式（hash/history）

### 4. 访问主应用全局变量

```typescript
// 子应用中访问真实 window
const realWindow = window.rawWindow || window;
const mainConfig = realWindow.__MAIN_APP_CONFIG__;
```

## 详细参考文档

- [Hooks API 详解](references/hooks-api.md)
- [微应用配置](references/micro-app.md)
- [微模块配置](references/micro-module.md)

## 类型定义

```typescript
import {
  loadApp,
  loadInstance,
  mount,
  unmount,
  activated,
  deactivated,
  unload,
  preLoadApp,
  preLoadInstance,
  preLoadSource,
  WewebMode,
  type IAppModelProps,
  type IJsModelProps,
  type BaseModel,
} from '@blueking/bk-weweb';
```
