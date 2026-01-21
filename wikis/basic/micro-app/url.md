# url 属性

## 概述

`url` 属性用于指定微应用的**入口地址**，是加载微应用的必填参数。BK-WeWeb 会从这个 URL 获取 HTML 内容，并解析其中的资源进行加载。

## 基本信息

| 属性     | 值       |
| -------- | -------- |
| 属性名   | `url`    |
| 类型     | `string` |
| 是否必填 | **是**   |
| 默认值   | -        |

## 使用方式

### Web Component

```html
<!-- 基础用法 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
/>

<!-- 带路径的 URL -->
<bk-weweb
  id="dashboard"
  url="http://localhost:8001/dashboard/"
/>

<!-- 带 hash 的 URL -->
<bk-weweb
  id="settings"
  url="http://localhost:8001/#/settings"
/>

<!-- 带 query 参数的 URL -->
<bk-weweb
  id="report"
  url="http://localhost:8001/?type=monthly&year=2024"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 基础用法
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 动态 URL
const baseUrl = import.meta.env.VITE_CHILD_APP_URL;
await loadApp({
  url: `${baseUrl}/dashboard/`,
  id: 'dashboard',
});
```

## 详细说明

### URL 格式支持

BK-WeWeb 支持完整的 URL 规范，包括：

```
[protocol://][host][:port][/path][?query][#hash]
```

| 组成部分 | 示例                           | 说明           |
| -------- | ------------------------------ | -------------- |
| protocol | `http://`, `https://`          | 协议，支持省略 |
| host     | `localhost`, `app.example.com` | 主机名         |
| port     | `:8001`, `:3000`               | 端口号         |
| path     | `/dashboard/`, `/admin/`       | 路径           |
| query    | `?id=1&type=user`              | 查询参数       |
| hash     | `#/home`, `#section1`          | 哈希值         |

### URL 处理逻辑

```typescript
// 1. 自动补全协议
'localhost:8001/' → 'http://localhost:8001/'
'//cdn.example.com/app/' → 'http://cdn.example.com/app/'

// 2. 资源路径补全
// 子应用 HTML 中的相对路径会自动补全为绝对路径
'./assets/logo.png' → 'http://localhost:8001/assets/logo.png'
'/static/js/main.js' → 'http://localhost:8001/static/js/main.js'
```

### 与 scopeLocation 配合

当设置 `scopeLocation: true` 时，URL 中的 path、query、hash 会保留在子应用的独立 Location 中：

```typescript
<bk-weweb
  id="my-app"
  url="http://localhost:8001/dashboard?tab=overview#section1"
  :scope-location="true"
/>

// 子应用中
// window.location.pathname → '/dashboard'
// window.location.search → '?tab=overview'
// window.location.hash → '#section1'
```

## 使用场景

### 场景一：加载本地开发应用

```typescript
// 开发环境
<bk-weweb
  id="dev-app"
  url="http://localhost:8001/"
/>
```

### 场景二：加载生产环境应用

```typescript
// 生产环境 - 使用环境变量
<bk-weweb
  id="prod-app"
  :url="childAppUrl"
/>

<script setup>
const childAppUrl = import.meta.env.VITE_CHILD_APP_URL || 'https://app.example.com/';
</script>
```

### 场景三：加载带初始路由的应用

```typescript
// 直接跳转到子应用的特定页面
<bk-weweb
  id="order-detail"
  url="http://localhost:8001/#/order/12345"
  :scope-location="true"
/>
```

### 场景四：动态切换应用

```vue
<template>
  <div class="app-switcher">
    <button @click="switchApp('dashboard')">Dashboard</button>
    <button @click="switchApp('settings')">Settings</button>
  </div>

  <bk-weweb
    :id="currentApp"
    :url="currentUrl"
    :key="currentApp"
  />
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';

  const apps = {
    dashboard: 'http://localhost:8001/',
    settings: 'http://localhost:8002/',
  };

  const currentApp = ref('dashboard');
  const currentUrl = computed(() => apps[currentApp.value]);

  function switchApp(app: string) {
    currentApp.value = app;
  }
</script>
```

## 注意事项

### 1. CORS 跨域配置

子应用服务器需要配置正确的 CORS 响应头：

```nginx
# Nginx 配置示例
location / {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type';
}
```

### 2. 资源路径问题

确保子应用的静态资源使用正确的路径配置：

```javascript
// Vue CLI - vue.config.js
module.exports = {
  publicPath: 'http://localhost:8001/',
};

// Vite - vite.config.ts
export default {
  base: 'http://localhost:8001/',
};

// Webpack - webpack.config.js
module.exports = {
  output: {
    publicPath: 'http://localhost:8001/',
  },
};
```

### 3. 入口文件要求

URL 指向的页面必须是有效的 HTML 文件，BK-WeWeb 会解析其中的：

- `<link rel="stylesheet">` - CSS 样式
- `<style>` - 内联样式
- `<script>` - JavaScript 脚本
- HTML 内容结构

### 4. 协议一致性

建议主应用和子应用使用相同的协议（都是 http 或都是 https），避免混合内容问题。

## 错误处理

```typescript
import { loadApp } from '@blueking/bk-weweb';

try {
  await loadApp({
    url: 'http://localhost:8001/',
    id: 'my-app',
  });
} catch (error) {
  // 常见错误：
  // - 网络错误：子应用服务未启动
  // - CORS 错误：未配置跨域
  // - 404 错误：URL 路径错误
  console.error('加载应用失败:', error);
}
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 应用入口 URL
   * @description 微应用的 HTML 入口地址，支持完整的 URL 格式
   * @required
   * @example 'http://localhost:8001/'
   * @example 'https://app.example.com/dashboard/'
   * @example 'http://localhost:8001/#/home?tab=1'
   */
  url: string;

  // ... 其他属性
}
```

## 相关属性

- [id](./id.md) - 应用唯一标识符
- [scopeLocation](./scope-location.md) - 路由隔离
- [initSource](./init-source.md) - 初始化资源
