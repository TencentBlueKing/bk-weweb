# scopeJs 属性

## 概述

`scopeJs` 属性用于控制是否启用 **JavaScript 沙箱隔离**。开启后，子应用的 JavaScript 代码将在隔离的沙箱环境中执行，防止全局变量污染。

## 基本信息

| 属性     | 值                                      |
| -------- | --------------------------------------- |
| 属性名   | `scopeJs` / `scope-js`                  |
| 类型     | `boolean`                               |
| 是否必填 | 否                                      |
| 默认值   | 微应用模式: `true`，微模块模式: `false` |

## 使用方式

### Web Component

```html
<!-- 开启 JS 隔离（微应用默认开启） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :scope-js="true"
/>

<!-- 关闭 JS 隔离 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :scope-js="false"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 开启 JS 隔离
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
});

// 关闭 JS 隔离
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: false,
});
```

## 详细说明

### 沙箱原理

BK-WeWeb 使用 ES6 Proxy 创建一个代理的 window 对象（proxyWindow），子应用的所有全局操作都会被代理拦截：

```
┌─────────────────────────────────────────────────────────────┐
│                     主应用 window                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   proxyWindow (A)   │  │   proxyWindow (B)   │          │
│  │   子应用 A 的沙箱    │  │   子应用 B 的沙箱    │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │ 变量隔离       │  │  │  │ 变量隔离       │  │          │
│  │  │ 函数重写       │  │  │  │ 函数重写       │  │          │
│  │  │ 事件隔离       │  │  │  │ 事件隔离       │  │          │
│  │  └───────────────┘  │  │  └───────────────┘  │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 沙箱提供的能力

#### 1. 全局变量隔离

```javascript
// 子应用 A
window.myGlobalVar = 'app-a';

// 子应用 B
window.myGlobalVar = 'app-b';

// 主应用
console.log(window.myGlobalVar); // undefined（主应用不受影响）
```

#### 2. document 代理

子应用操作 document 时会自动限定在容器范围内：

```javascript
// 子应用中
document.body.appendChild(element); // 实际添加到子应用容器中
document.querySelector('.header'); // 只在子应用范围内查询
```

#### 3. 事件隔离

子应用的事件监听会在卸载时自动清理：

```javascript
// 子应用中添加的事件
window.addEventListener('resize', handler);

// 子应用卸载时自动移除
```

#### 4. 定时器隔离

```javascript
// 子应用中的定时器会被追踪
setInterval(() => {}, 1000);
setTimeout(() => {}, 5000);

// 子应用卸载时自动清理
```

### 子应用中访问沙箱环境

```javascript
// 判断是否在沙箱环境中
if (window.__POWERED_BY_BK_WEWEB__) {
  console.log('Running in BK-WeWeb sandbox');

  // 获取应用标识
  console.log(window.__BK_WEWEB_APP_KEY__);

  // 获取主应用传递的数据
  console.log(window.__BK_WEWEB_DATA__);

  // 访问真实的 window 对象
  console.log(window.rawWindow);

  // 访问真实的 document 对象
  console.log(window.rawDocument);
}
```

### 白名单机制

某些全局变量需要在子应用间共享，BK-WeWeb 提供了白名单机制：

```typescript
// 内置白名单（部分）
const WINDOW_WHITE_LIST = [
  'System', // SystemJS
  '__cjsWrapper', // CommonJS wrapper
];

// 开发环境额外白名单
const DEV_WINDOW_WHITE_LIST = [
  '__VUE_DEVTOOLS_GLOBAL_HOOK__',
  '__REACT_DEVTOOLS_GLOBAL_HOOK__',
  // ...
];
```

## 使用场景

### 场景一：多应用共存

多个子应用同时运行，需要隔离各自的全局状态：

```html
<bk-weweb
  id="app-a"
  url="http://a.example.com/"
  :scope-js="true"
/>
<bk-weweb
  id="app-b"
  url="http://b.example.com/"
  :scope-js="true"
/>
```

### 场景二：共享全局库

子应用需要使用主应用已加载的库，可以关闭隔离：

```html
<!-- 子应用使用主应用的 Vue、jQuery 等 -->
<bk-weweb
  id="legacy-app"
  url="http://legacy.example.com/"
  :scope-js="false"
/>
```

### 场景三：调试模式

开发调试时，可能需要直接访问真实 window：

```javascript
// 子应用中
const realWindow = window.rawWindow;
realWindow.debugVar = 'debug';
```

## 注意事项

### 1. eval 和动态脚本

沙箱会正确处理 eval 和动态创建的脚本：

```javascript
// 子应用中使用 eval
eval('window.myVar = 1'); // 在沙箱中执行

// 动态创建 script
const script = document.createElement('script');
script.textContent = 'window.myVar = 2';
document.body.appendChild(script); // 在沙箱中执行
```

### 2. 第三方库兼容性

某些第三方库可能直接操作 window，需要注意兼容性：

```javascript
// 如果第三方库使用了不在白名单的全局变量
// 可能需要手动处理或关闭隔离
```

### 3. 性能影响

Proxy 代理会带来轻微的性能开销，但在现代浏览器中基本可以忽略。

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否启用 JavaScript 沙箱隔离
   * @description 开启后子应用的 JS 代码在隔离环境中执行
   * @default true (微应用模式)
   * @default false (微模块模式)
   */
  scopeJs?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeCss](./scope-css.md) - CSS 样式隔离
- [scopeLocation](./scope-location.md) - 路由隔离
- [setShadowDom](./set-shadow-dom.md) - Shadow DOM 模式
