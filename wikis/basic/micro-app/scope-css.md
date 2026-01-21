# scopeCss 属性

## 概述

`scopeCss` 属性用于控制是否启用 **CSS 样式隔离**。开启后，子应用的 CSS 选择器会被自动添加作用域前缀，防止样式污染主应用或其他子应用。

## 基本信息

| 属性     | 值                       |
| -------- | ------------------------ |
| 属性名   | `scopeCss` / `scope-css` |
| 类型     | `boolean`                |
| 是否必填 | 否                       |
| 默认值   | `true`                   |

## 使用方式

### Web Component

```html
<!-- 开启 CSS 隔离（默认） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :scope-css="true"
/>

<!-- 关闭 CSS 隔离 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :scope-css="false"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 开启 CSS 隔离
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeCss: true,
});

// 关闭 CSS 隔离
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeCss: false,
});
```

## 详细说明

### 隔离原理

BK-WeWeb 会解析子应用的 CSS 规则，为每个选择器添加容器 ID 作为前缀：

```css
/* ========== 原始样式 ========== */
.header {
  background: #333;
}

.nav > .item {
  color: white;
}

body {
  margin: 0;
}

html,
body {
  height: 100%;
}

* {
  box-sizing: border-box;
}

/* ========== 处理后样式 ========== */
#my-app .header {
  background: #333;
}

#my-app .nav > .item {
  color: white;
}

#my-app {
  margin: 0;
}

#my-app {
  height: 100%;
}

#my-app * {
  box-sizing: border-box;
}
```

### 处理规则

| 原始选择器         | 处理后           | 说明             |
| ------------------ | ---------------- | ---------------- |
| `.class`           | `#app-id .class` | 普通类选择器     |
| `#id`              | `#app-id #id`    | ID 选择器        |
| `div`              | `#app-id div`    | 元素选择器       |
| `body`             | `#app-id`        | body 替换为容器  |
| `html`             | `#app-id`        | html 替换为容器  |
| `:root`            | `#app-id`        | :root 替换为容器 |
| `*`                | `#app-id *`      | 通配符选择器     |
| `html body .class` | `#app-id .class` | 复合选择器       |

### 特殊规则处理

#### @media 媒体查询

```css
/* 原始 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}

/* 处理后 */
@media (max-width: 768px) {
  #my-app .sidebar {
    display: none;
  }
}
```

#### @supports 规则

```css
/* 原始 */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

/* 处理后 */
@supports (display: grid) {
  #my-app .container {
    display: grid;
  }
}
```

#### @font-face 规则

`@font-face` 规则不会添加前缀，保持原样：

```css
/* 保持不变 */
@font-face {
  font-family: 'MyFont';
  src: url('./fonts/myfont.woff2');
}
```

#### @keyframes 动画

```css
/* 保持不变 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### URL 路径处理

CSS 中的相对路径 URL 会自动转换为绝对路径：

```css
/* 原始 */
.logo {
  background: url('./images/logo.png');
}

/* 处理后 */
#my-app .logo {
  background: url('http://child-app.example.com/images/logo.png');
}
```

## 与 Shadow DOM 的关系

当启用 `setShadowDom` 时，`scopeCss` 会自动失效，因为 Shadow DOM 本身提供了更彻底的样式隔离：

```html
<!-- 使用 Shadow DOM 时，scopeCss 无效 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :set-shadow-dom="true"
  :scope-css="true"  <!-- 此配置无效，Shadow DOM 自带隔离 -->
/>
```

## 使用场景

### 场景一：标准隔离

默认开启，防止子应用样式影响主应用：

```html
<bk-weweb
  id="child-app"
  url="http://localhost:8001/"
  :scope-css="true"
/>
```

### 场景二：样式共享

需要子应用继承主应用样式时关闭隔离：

```html
<!-- 子应用需要使用主应用的全局样式 -->
<bk-weweb
  id="themed-app"
  url="http://localhost:8001/"
  :scope-css="false"
/>
```

### 场景三：第三方 UI 库共享

主应用和子应用使用相同的 UI 库，避免重复加载：

```html
<!-- 子应用使用主应用已加载的 Element UI 等 -->
<bk-weweb
  id="shared-ui-app"
  url="http://localhost:8001/"
  :scope-css="false"
/>
```

## 注意事项

### 1. !important 规则

使用 `!important` 的样式可能会穿透隔离：

```css
/* 这个样式可能影响其他应用 */
.global-class {
  color: red !important;
}
```

建议子应用避免过度使用 `!important`。

### 2. 全局选择器

某些全局选择器可能导致样式泄露：

```css
/* 可能影响主应用的 body */
body::before {
  content: '';
}
```

### 3. CSS 变量

CSS 变量（Custom Properties）默认是继承的：

```css
/* 子应用定义的变量可能影响其他应用 */
:root {
  --primary-color: blue;
}
```

如果需要隔离 CSS 变量，建议使用 Shadow DOM。

### 4. 动态样式

运行时动态添加的样式也会被处理：

```javascript
// 子应用中动态添加的样式也会被添加前缀
const style = document.createElement('style');
style.textContent = '.dynamic { color: red; }';
document.head.appendChild(style);
// 结果：#app-id .dynamic { color: red; }
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否启用 CSS 样式隔离
   * @description 开启后子应用的 CSS 选择器会添加作用域前缀
   * @default true
   */
  scopeCss?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [setShadowDom](./set-shadow-dom.md) - Shadow DOM 模式
- [id](./id.md) - 应用标识（用作 CSS 前缀）
