# 微应用配置详解

## 概述

微应用模式加载完整的远程 HTML 应用（HTML Entry），通过解析 HTML 提取 CSS/JS 资源，在隔离环境中执行。

## 配置属性

### url（必填）

应用入口 URL，指向子应用的 HTML 入口文件。

```typescript
await loadApp({ url: 'http://localhost:8001/' });
await loadApp({ url: 'http://localhost:8001/index.html' });
```

### id

应用唯一标识符，用于缓存管理和生命周期控制。不设置时使用 URL 作为缓存键。

```typescript
await loadApp({ url: '...', id: 'dashboard' });

// 后续通过 id 操作
mount('dashboard', container);
unmount('dashboard');
```

### scopeJs（默认 true）

JS 沙箱隔离，基于 Proxy 实现。

```typescript
// 开启沙箱（默认）
await loadApp({ url: '...', scopeJs: true });

// 关闭沙箱（不推荐，仅用于兼容特殊库）
await loadApp({ url: '...', scopeJs: false });
```

**沙箱特性**：

- 子应用对 window 的修改不影响主应用
- 子应用之间全局变量隔离
- document 操作自动代理到子应用容器
- 支持 eval、动态 script 等场景

**沙箱环境下访问原始对象**：

```typescript
// 子应用中
const realWindow = window.rawWindow;
const realDocument = window.rawDocument;
```

### scopeCss（默认 true）

CSS 样式隔离，为选择器添加作用域前缀。

```typescript
await loadApp({ url: '...', scopeCss: true });
```

**处理示例**：

```css
/* 原始 */
.header {
  color: red;
}

/* 处理后 */
#app-name .header {
  color: red;
}
```

### scopeLocation（默认 false）

路由隔离，为子应用提供独立的 location 和 history。

```typescript
// 开启路由隔离
await loadApp({ url: '...', scopeLocation: true });
```

**适用场景**：

- 子应用有独立路由系统
- 子应用路由变化不应影响浏览器地址栏
- 多个子应用同时展示各自路由页面

**实现原理**：通过隐藏 iframe 提供原生 location 行为。

### setShadowDom（默认 false）

使用 Shadow DOM 渲染，提供更彻底的 DOM 和样式隔离。

```typescript
await loadApp({ url: '...', setShadowDom: true });
```

**优点**：

- 样式完全隔离，不会泄露
- DOM 结构隔离

**缺点**：

- 弹窗类组件（挂载到 body）样式会丢失
- 需配置组件 teleport/getContainer 属性

### keepAlive（默认 false）

缓存模式，切换时保留 DOM 状态。

```typescript
await loadApp({ url: '...', keepAlive: true });

// 使用 activated/deactivated 切换
activated('my-app', container);
deactivated('my-app');

// 完全销毁缓存
unload('http://localhost:8001/');
```

### data

传递给子应用的数据，子应用通过 `window.__BK_WEWEB_DATA__` 访问。

```typescript
// 主应用
await loadApp({
  url: '...',
  data: {
    userId: '123',
    config: { theme: 'dark' },
    store: myStore, // 可传递对象引用
    onEvent: e => handle(e), // 可传递函数
  },
});

// 子应用
const { userId, config, store, onEvent } = window.__BK_WEWEB_DATA__;
```

**Web Component 方式需序列化**：

```vue
<bk-weweb :data="JSON.stringify({ userId: '123' })" />
```

### initSource

子应用加载前预先加载的资源列表。

```typescript
await loadApp({
  url: '...',
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/element-ui/index.css'],
});

// 动态获取
await loadApp({
  url: '...',
  initSource: async () => {
    const res = await fetch('/api/common-resources');
    return res.json();
  },
});
```

### showSourceCode（默认 false）

是否以 `<script>` 标签形式插入脚本（方便调试）。

```typescript
await loadApp({ url: '...', showSourceCode: true });
```

## 生命周期状态

```
UNSET → LOADING → LOADED → MOUNTING → MOUNTED
                                ↓
                           ACTIVATED ⟷ DEACTIVATED
                                ↓
                            UNMOUNT
```

| 状态        | 说明                     |
| ----------- | ------------------------ |
| UNSET       | 初始状态                 |
| LOADING     | 正在加载资源             |
| LOADED      | 资源加载完成             |
| MOUNTING    | 正在挂载                 |
| MOUNTED     | 已挂载完成               |
| ACTIVATED   | 已激活（keepAlive 模式） |
| DEACTIVATED | 已停用（keepAlive 模式） |
| UNMOUNT     | 已卸载                   |
| ERROR       | 加载出错                 |

## 完整配置示例

```typescript
await loadApp({
  // 必填
  url: 'http://localhost:8001/',

  // 标识
  id: 'dashboard',

  // 隔离配置
  scopeJs: true,
  scopeCss: true,
  scopeLocation: false,
  setShadowDom: false,

  // 缓存模式
  keepAlive: true,

  // 调试
  showSourceCode: false,

  // 数据传递
  data: {
    userId: '123',
    token: 'xxx',
    config: { theme: 'dark' },
  },

  // 预加载资源
  initSource: ['https://cdn.example.com/shared-lib.js'],
});
```

## 子应用要求

### CORS 配置

子应用服务器需要允许跨域：

```
Access-Control-Allow-Origin: http://main-app.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 资源路径

使用绝对路径或正确配置 publicPath：

```javascript
// Webpack
output: {
  publicPath: 'http://localhost:8001/';
}

// Vite
base: 'http://localhost:8001/';
```

### 环境检测

```typescript
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__;
  const data = window.__BK_WEWEB_DATA__;
  // 微前端特有逻辑
}
```
