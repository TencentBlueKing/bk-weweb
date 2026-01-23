# 微应用配置详解

## 概述

微应用模式用于加载独立部署的远程应用（HTML Entry），子应用无需任何改造即可接入。

## 工作原理

```
1. 获取 HTML Entry
   fetch('http://child-app.example.com/')
              ↓
2. 解析资源
   - 提取 <link> 中的 CSS
   - 提取 <script> 中的 JS
   - 保留 HTML 结构
              ↓
3. 处理隔离
   - CSS: 添加作用域前缀
   - JS: 创建 Proxy 沙箱
   - Location: 创建独立路由环境
              ↓
4. 渲染挂载
   - 将 HTML 插入容器
   - 执行样式和脚本
```

## 属性详解

### url (必填)

应用入口 URL，指向子应用的 HTML 入口。

```vue
<bk-weweb url="http://localhost:8001/" />
```

### id

应用唯一标识符，用于缓存复用和生命周期管理。

```vue
<bk-weweb id="my-app" url="..." />
```

**注意**：相同 `id` 的应用会共享缓存。

### scopeJs

是否启用 JS 沙箱隔离。默认 `true`。

```vue
<bk-weweb :scope-js="true" url="..." />
```

**工作原理**：

- 基于 ES6 Proxy 实现
- 子应用对 window 的修改不影响主应用
- 子应用之间全局变量相互隔离
- 支持 document 代理

### scopeCss

是否启用 CSS 样式隔离。默认 `true`。

```vue
<bk-weweb :scope-css="true" url="..." />
```

**工作原理**：

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

### scopeLocation

是否启用路由隔离。默认 `false`。

```vue
<bk-weweb :scope-location="true" url="..." />
```

**功能**：

- 子应用拥有独立的 location 和 history
- 子应用路由变化不影响浏览器地址栏
- 多个子应用可同时展示各自的路由页面

### setShadowDom

是否使用 Shadow DOM 渲染。默认 `false`。

```vue
<bk-weweb :set-shadow-dom="true" url="..." />
```

**优势**：更彻底的 DOM 和样式隔离。

**注意**：某些全局样式和第三方库可能不兼容。

### keepAlive

是否启用缓存模式。默认 `false`。

```vue
<bk-weweb :keep-alive="true" url="..." />
```

**功能**：

- 应用切换时保留 DOM 状态
- 使用 `activated/deactivated` 切换显示

### showSourceCode

是否在 DOM 中显示源码。默认 `false`。

```vue
<bk-weweb :show-source-code="true" url="..." />
```

开启后脚本以 `<script>` 标签形式插入，便于调试。

### data

传递给子应用的数据。

**Web Component 方式**（需 JSON 序列化）：

```vue
<bk-weweb :data="JSON.stringify({ userId: '123', token: 'xxx' })" url="..." />
```

**Hooks 方式**（直接传对象，保持引用）：

```typescript
loadApp({
  url: '...',
  id: 'my-app',
  data: {
    userId: '123',
    token: 'xxx',
    config: { theme: 'dark' },
    // 可以传递函数
    onEvent: data => console.log(data),
  },
});
```

### initSource

初始化资源列表，在子应用加载前预先加载。

```typescript
loadApp({
  url: '...',
  id: 'my-app',
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/common.css'],
});
```

## 完整示例

### Web Component 方式

```vue
<template>
  <bk-weweb
    id="dashboard"
    url="http://localhost:8001/"
    :scope-js="true"
    :scope-css="true"
    :scope-location="false"
    :set-shadow-dom="false"
    :keep-alive="true"
    :show-source-code="false"
    :data="JSON.stringify(appData)"
  />
</template>

<script setup>
  const appData = {
    userId: '12345',
    token: 'xxx',
    theme: 'dark',
  };
</script>
```

### Hooks 方式

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
  scopeLocation: false,
  setShadowDom: false,
  keepAlive: true,
  showSourceCode: false,
  data: {
    userId: '12345',
    token: 'xxx',
    theme: 'dark',
  },
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/common.css'],
});

mount('dashboard', document.getElementById('container'));

// 卸载
unmount('dashboard');
```

## 子应用适配

子应用无需改造，但可以通过全局变量判断运行环境：

```typescript
// 子应用入口
if (window.__POWERED_BY_BK_WEWEB__) {
  console.log('运行在 BK-WeWeb 环境');

  // 获取主应用传递的数据
  const data = window.__BK_WEWEB_DATA__;
  const appKey = window.__BK_WEWEB_APP_KEY__;

  // 初始化
  initWithData(data);
} else {
  // 独立运行
  initStandalone();
}
```

## 子应用 CORS 配置

子应用需要配置正确的 CORS 头：

```
Access-Control-Allow-Origin: http://main-app.example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## 子应用资源路径

确保子应用的静态资源使用绝对路径或正确配置 publicPath：

```javascript
// vue.config.js
module.exports = {
  publicPath: 'http://localhost:8001/',
};

// vite.config.js
export default {
  base: 'http://localhost:8001/',
};
```
