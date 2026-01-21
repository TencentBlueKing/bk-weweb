# scopeLocation 属性

## 概述

`scopeLocation` 属性用于控制是否启用**路由隔离**。开启后，子应用将拥有独立的 `location` 和 `history` 对象，其路由变化不会影响浏览器地址栏，与主应用和其他子应用的路由完全隔离。

## 基本信息

| 属性     | 值                                 |
| -------- | ---------------------------------- |
| 属性名   | `scopeLocation` / `scope-location` |
| 类型     | `boolean`                          |
| 是否必填 | 否                                 |
| 默认值   | `false`                            |
| 支持模式 | 仅微应用模式                       |

## 使用方式

### Web Component

```html
<!-- 开启路由隔离 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/#/dashboard"
  :scope-location="true"
/>

<!-- 共享主应用路由（默认） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :scope-location="false"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 开启路由隔离
await loadApp({
  url: 'http://localhost:8001/#/dashboard',
  id: 'my-app',
  scopeLocation: true,
});

// 共享主应用路由
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeLocation: false,
});
```

## 详细说明

### 实现原理

BK-WeWeb 通过创建一个隐藏的 iframe 来实现路由隔离：

```
┌─────────────────────────────────────────────────────────────┐
│  主应用 window                                               │
│  location: http://main-app.com/page                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  子应用 proxyWindow                                  │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  隐藏 iframe                                 │   │   │
│  │  │  location: http://child-app.com/#/dashboard │   │   │
│  │  │  history: 子应用独立的历史记录                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

子应用访问 `window.location` 和 `window.history` 时，会被代理到 iframe 的相应对象。

### 路由隔离的效果

| 行为                   | scopeLocation: false | scopeLocation: true |
| ---------------------- | -------------------- | ------------------- |
| 子应用 `location.href` | 主应用 URL           | 子应用独立 URL      |
| 子应用 `history.push`  | 影响浏览器地址栏     | 不影响浏览器地址栏  |
| 子应用路由变化         | 同步到主应用         | 完全隔离            |
| 主应用路由变化         | 可能影响子应用       | 不影响子应用        |
| 浏览器前进/后退        | 触发子应用路由       | 不触发子应用路由    |

### URL 参数传递

开启路由隔离时，可以通过 URL 传递初始路由信息：

```html
<!-- 子应用初始路由为 /dashboard?tab=overview -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/#/dashboard?tab=overview"
  :scope-location="true"
/>
```

子应用中获取路由信息：

```javascript
// 子应用中
console.log(location.pathname); // '/dashboard'
console.log(location.search); // '?tab=overview'
console.log(location.hash); // '#/dashboard?tab=overview' (hash 模式)
```

## 使用场景

### 场景一：多应用同页面展示

多个子应用同时在页面上展示，各自有独立的路由：

```html
<div class="dashboard">
  <!-- 订单管理应用 -->
  <bk-weweb
    id="order-app"
    url="http://order.example.com/#/list"
    :scope-location="true"
  />

  <!-- 用户管理应用 -->
  <bk-weweb
    id="user-app"
    url="http://user.example.com/#/list"
    :scope-location="true"
  />
</div>
```

### 场景二：应用内嵌组件

将子应用作为页面组件嵌入，不希望影响主应用路由：

```html
<div class="main-content">
  <h1>主应用页面</h1>

  <!-- 嵌入的报表应用，路由独立 -->
  <div class="report-widget">
    <bk-weweb
      id="report-app"
      url="http://report.example.com/"
      :scope-location="true"
    />
  </div>
</div>
```

### 场景三：避免路由冲突

主应用和子应用使用相同的路由路径，需要隔离：

```html
<!-- 主应用路由: /settings -->
<!-- 子应用也有 /settings 路由，需要隔离避免冲突 -->
<bk-weweb
  id="sub-app"
  url="http://sub.example.com/#/settings"
  :scope-location="true"
/>
```

### 场景四：保持子应用路由状态

子应用切换时保持其内部路由状态：

```vue
<template>
  <div>
    <button @click="showApp = !showApp">切换</button>

    <bk-weweb
      v-if="showApp"
      id="stateful-app"
      url="http://localhost:8001/"
      :scope-location="true"
      :keep-alive="true"
    />
  </div>
</template>
```

## 注意事项

### 1. 仅支持微应用模式

`scopeLocation` 仅在微应用模式下有效：

```html
<!-- ✅ 有效：微应用模式 -->
<bk-weweb
  mode="app"
  url="..."
  :scope-location="true"
/>

<!-- ❌ 无效：微模块模式 -->
<bk-weweb
  mode="js"
  url="..."
  :scope-location="true"
/>
```

### 2. 浏览器兼容性

路由隔离依赖隐藏 iframe，在某些情况下可能有兼容性问题：

- Chrome：完全支持
- Firefox：支持（使用不同的初始化方式）
- Safari：支持
- Edge：支持

### 3. 与 Hash 路由配合

推荐子应用使用 Hash 路由模式，与路由隔离配合更好：

```javascript
// Vue Router 配置
const router = createRouter({
  history: createWebHashHistory(), // 推荐
  routes: [...]
});
```

### 4. 初始路由传递

通过 URL 传递初始路由时，需要注意格式：

```html
<!-- Hash 路由模式 -->
<bk-weweb
  url="http://app.example.com/#/page"
  :scope-location="true"
/>

<!-- History 路由模式 -->
<bk-weweb
  url="http://app.example.com/page"
  :scope-location="true"
/>
```

### 5. 路由同步需求

如果需要同步子应用路由到主应用，可以通过通信机制实现：

```javascript
// 子应用中
router.afterEach(to => {
  // 通过 postMessage 或自定义事件通知主应用
  window.parent.postMessage(
    {
      type: 'ROUTE_CHANGE',
      path: to.fullPath,
    },
    '*',
  );
});
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否启用路由隔离
   * @description 开启后子应用拥有独立的 location 和 history
   * @default false
   * @remarks 仅在微应用模式下有效
   */
  scopeLocation?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [url](./url.md) - 应用入口 URL
- [keepAlive](./keep-alive.md) - 缓存模式
