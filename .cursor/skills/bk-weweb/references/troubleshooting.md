# 故障排除指南

## 加载问题

### 子应用加载失败（CORS 错误）

**症状**: 控制台报 CORS 跨域错误

**解决方案**:

```nginx
# Nginx 配置
server {
    location / {
        add_header Access-Control-Allow-Origin "http://main-app.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

```javascript
// Webpack Dev Server 配置
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  }
}
```

```typescript
// Vite 配置
export default {
  server: {
    cors: true,
  },
};
```

### 子应用资源 404

**症状**: JS/CSS 文件加载 404

**原因**: 子应用资源路径是相对路径

**解决方案**: 配置子应用的 publicPath

```javascript
// Webpack
output: {
  publicPath: 'http://localhost:8001/',
}

// Vite
base: 'http://localhost:8001/',
```

## 样式问题

### 样式冲突

**症状**: 主应用和子应用样式相互影响

**解决方案**:

1. 确认 `scopeCss: true`（默认开启）
2. 使用 Shadow DOM 彻底隔离：`setShadowDom: true`
3. 检查子应用是否使用了 `!important`

### Shadow DOM 下第三方组件样式丢失

**症状**: 弹窗、下拉框等样式不正确

**原因**: 这些组件挂载到 body 上，超出 Shadow DOM 范围

**解决方案**:

```typescript
// 方案1: 不使用 Shadow DOM
setShadowDom: false

// 方案2: 配置组件挂载位置
// Element Plus
<el-dialog :teleported="false">

// Ant Design
<Modal getContainer={false}>
```

## 路由问题

### 子应用路由跳转影响主应用

**症状**: 子应用路由变化导致主应用刷新或路由变化

**解决方案**: 开启路由隔离

```typescript
await loadApp({
  url: '...',
  id: 'my-app',
  scopeLocation: true, // 开启路由隔离
});
```

### 子应用 History 路由刷新 404

**症状**: 子应用使用 history 模式，刷新后 404

**解决方案**: 配置服务器 fallback

```nginx
location /child-app {
    try_files $uri $uri/ /child-app/index.html;
}
```

## JS 沙箱问题

### 全局变量访问异常

**症状**: 子应用访问全局变量报错或值不正确

**解决方案**:

```typescript
// 获取原始 window
const rawWindow = window.rawWindow;

// 获取原始 document
const rawDocument = window.rawDocument;
```

### 第三方库不兼容沙箱

**症状**: 某些第三方库在沙箱环境下报错

**解决方案**:

```typescript
// 方案1: 关闭 JS 沙箱（不推荐）
scopeJs: false;

// 方案2: 将库作为初始资源加载
await loadApp({
  url: '...',
  id: 'my-app',
  initSource: ['https://cdn.example.com/problematic-lib.js'],
});
```

## KeepAlive 问题

### 缓存应用状态不更新

**症状**: 重新激活应用后数据没有更新

**解决方案**: 监听 activated 事件刷新数据

```typescript
// 子应用中
if (window.__POWERED_BY_BK_WEWEB__) {
  window.addEventListener('bk-weweb-activated', () => {
    // 刷新数据
    fetchData();
  });
}
```

### 内存占用过高

**症状**: 多个 keepAlive 应用导致内存占用过高

**解决方案**:

```typescript
import { unload } from '@blueking/bk-weweb';

// 不再需要时删除缓存
unload('http://localhost:8001/');
```

## 通信问题

### 主子应用数据传递

**方案1: 通过 data 属性**

```typescript
await loadApp({
  url: '...',
  id: 'my-app',
  data: {
    store: myStore,
    eventBus: myEventBus,
    onMessage: msg => console.log(msg),
  },
});

// 子应用中
const { store, eventBus, onMessage } = window.__BK_WEWEB_DATA__;
```

**方案2: 自定义事件**

```typescript
// 主应用发送
window.dispatchEvent(new CustomEvent('main-to-child', { detail: data }));

// 子应用接收
window.addEventListener('main-to-child', e => {
  console.log(e.detail);
});
```

## 性能问题

### 首次加载慢

**解决方案**: 使用预加载

```typescript
import { preLoadApp } from '@blueking/bk-weweb';

// 在空闲时预加载
requestIdleCallback(() => {
  preLoadApp({
    url: 'http://localhost:8001/',
    id: 'my-app',
  });
});
```

### 切换应用闪烁

**解决方案**: 使用 keepAlive 模式

```typescript
await loadApp({
  url: '...',
  id: 'my-app',
  keepAlive: true,
});

// 使用 activated/deactivated 切换
activated('my-app', container);
deactivated('my-app');
```
