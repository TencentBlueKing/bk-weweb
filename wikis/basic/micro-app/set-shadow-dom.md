# setShadowDom 属性

## 概述

`setShadowDom` 属性用于控制是否使用 **Shadow DOM** 渲染子应用。开启后，子应用将渲染在 Shadow DOM 中，获得浏览器原生的样式和 DOM 隔离能力。

## 基本信息

| 属性     | 值                                |
| -------- | --------------------------------- |
| 属性名   | `setShadowDom` / `set-shadow-dom` |
| 类型     | `boolean`                         |
| 是否必填 | 否                                |
| 默认值   | `false`                           |

## 使用方式

### Web Component

```html
<!-- 启用 Shadow DOM -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :set-shadow-dom="true"
/>

<!-- 不使用 Shadow DOM（默认） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :set-shadow-dom="false"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 启用 Shadow DOM
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  setShadowDom: true,
});
```

## 详细说明

### 什么是 Shadow DOM

Shadow DOM 是 Web Components 标准的一部分，它允许将一个隐藏的、独立的 DOM 树附加到一个元素上。这个隐藏的 DOM 树与主文档的 DOM 树是分开的，拥有自己独立的作用域。

```
┌─────────────────────────────────────────────────────────────┐
│  <bk-weweb>                                                  │
│  ├── #shadow-root (open)                                    │
│  │   └── 子应用内容                                          │
│  │       ├── <style>...</style>  (样式完全隔离)              │
│  │       ├── <div>...</div>                                 │
│  │       └── <script>...</script>                           │
│  └── (light DOM - 空)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Shadow DOM 的隔离特性

#### 1. 样式隔离

- 外部样式不会影响 Shadow DOM 内部
- 内部样式不会泄露到外部
- CSS 选择器不会跨越 Shadow 边界

```css
/* 主应用的样式 */
.header {
  color: red;
} /* 不会影响 Shadow DOM 内的 .header */

/* Shadow DOM 内的样式 */
.header {
  color: blue;
} /* 不会影响主应用的 .header */
```

#### 2. DOM 隔离

- `document.querySelector` 无法查询到 Shadow DOM 内的元素
- Shadow DOM 内的 ID 不会与外部冲突

```javascript
// 主应用
document.querySelector('.header'); // 只能查到主应用的元素

// 子应用（在 Shadow DOM 内）
document.querySelector('.header'); // 只能查到 Shadow DOM 内的元素
```

#### 3. 事件封装

事件会在 Shadow 边界处被重新定向：

```javascript
// Shadow DOM 内的点击事件
// event.target 在外部访问时会被重定向为 host 元素
```

### 与 scopeCss 的关系

当启用 `setShadowDom` 时，`scopeCss` 会自动失效：

```html
<!-- scopeCss 无效，因为 Shadow DOM 自带样式隔离 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :set-shadow-dom="true"
  :scope-css="true"  <!-- 此配置会被忽略 -->
/>
```

### Shadow DOM 模式下的特殊处理

#### 1. @font-face 处理

由于 Shadow DOM 的限制，`@font-face` 规则需要添加到主文档中才能生效。BK-WeWeb 会自动处理：

```javascript
// 自动将 @font-face 规则提升到主文档 head 中
```

#### 2. echarts 等图表库兼容

某些图表库需要获取容器的尺寸，BK-WeWeb 会自动处理 Shadow DOM 的 `getBoundingClientRect`：

```javascript
// 自动代理 getBoundingClientRect 方法
Object.defineProperties(shadowRoot, {
  getBoundingClientRect: {
    get() {
      return this.host.getBoundingClientRect;
    },
  },
});
```

## 使用场景

### 场景一：强隔离需求

需要完全隔离样式，防止任何样式泄露：

```html
<!-- 第三方应用，样式不可控 -->
<bk-weweb
  id="third-party-app"
  url="http://third-party.example.com/"
  :set-shadow-dom="true"
/>
```

### 场景二：样式冲突严重

主应用和子应用存在大量样式冲突：

```html
<!-- 子应用使用相同的 UI 框架但不同版本 -->
<bk-weweb
  id="legacy-app"
  url="http://legacy.example.com/"
  :set-shadow-dom="true"
/>
```

### 场景三：组件封装

将子应用作为独立组件封装：

```html
<div class="widget-container">
  <bk-weweb
    id="chart-widget"
    url="http://chart.example.com/"
    :set-shadow-dom="true"
  />
</div>
```

## 注意事项

### 1. 弹窗定位问题

某些 UI 组件的弹窗（Modal、Dropdown 等）可能会定位到 body 上，在 Shadow DOM 模式下可能出现问题：

```javascript
// 解决方案：配置弹窗的挂载容器
// Element Plus
app.use(ElementPlus, {
  appendTo: shadowRoot, // 挂载到 Shadow DOM 内
});
```

### 2. 全局事件监听

在 Shadow DOM 内添加的全局事件监听可能需要特殊处理：

```javascript
// 使用 window.rawDocument 添加全局事件
const realDocument = window.rawDocument || document;
realDocument.addEventListener('click', handler);
```

### 3. CSS 继承

某些 CSS 属性会继承到 Shadow DOM 内：

```css
/* 这些属性会继承 */
font-family, font-size, color, line-height...

/* 这些属性不会继承 */
background, border, margin, padding...
```

### 4. JavaScript 库兼容性

某些 JavaScript 库可能不支持 Shadow DOM：

- 需要直接操作 `document.body` 的库
- 使用 `document.querySelector` 查询全局元素的库
- 依赖特定 DOM 结构的库

### 5. 性能考虑

Shadow DOM 会增加一定的内存开销，多个 Shadow DOM 可能影响性能。

## 最佳实践

### 1. 选择合适的隔离方式

```html
<!-- 一般场景：使用 scopeCss -->
<bk-weweb
  url="..."
  :scope-css="true"
/>

<!-- 强隔离需求：使用 Shadow DOM -->
<bk-weweb
  url="..."
  :set-shadow-dom="true"
/>
```

### 2. 处理弹窗组件

```vue
<template>
  <bk-weweb
    id="app-with-modal"
    url="http://localhost:8001/"
    :set-shadow-dom="true"
    ref="wewebRef"
  />
</template>

<script setup>
  // 子应用中需要获取 Shadow Root 作为弹窗容器
  // 通过 window.__BK_WEWEB_DATA__ 传递或通过 DOM 获取
</script>
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否使用 Shadow DOM 渲染
   * @description 开启后子应用渲染在 Shadow DOM 中，获得原生隔离能力
   * @default false
   */
  setShadowDom?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeCss](./scope-css.md) - CSS 样式隔离
- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [keepAlive](./keep-alive.md) - 缓存模式
