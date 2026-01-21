# showSourceCode 属性

## 概述

`showSourceCode` 属性用于控制子应用的 JavaScript 代码**执行方式**。开启后，脚本代码会以内联 `<script>` 标签的形式插入到 DOM 中；关闭时，代码将在内存中通过 `new Function` 执行。

## 基本信息

| 属性     | 值                                      |
| -------- | --------------------------------------- |
| 属性名   | `showSourceCode` / `show-source-code`   |
| 类型     | `boolean`                               |
| 是否必填 | 否                                      |
| 默认值   | 微应用模式: `false`，微模块模式: `true` |

## 使用方式

### Web Component

```html
<!-- 显示源码（在 DOM 中可见） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :show-source-code="true"
/>

<!-- 内存执行（默认，DOM 中不可见） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :show-source-code="false"
/>
```

### Hooks API

```typescript
import { loadApp } from '@blueking/bk-weweb';

// 显示源码
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  showSourceCode: true,
});

// 内存执行
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  showSourceCode: false,
});
```

## 详细说明

### 两种执行方式对比

| 特性       | showSourceCode: true    | showSourceCode: false |
| ---------- | ----------------------- | --------------------- |
| 执行方式   | `<script>` 标签         | `new Function`        |
| DOM 可见   | ✅ 可在 DevTools 中看到 | ❌ 不可见             |
| 调试体验   | 更好，有完整的调用栈    | 较差，调用栈不完整    |
| Source Map | ✅ 正常工作             | ⚠️ 需要特殊处理       |
| 性能       | 略低                    | 略高                  |
| 沙箱隔离   | ✅ 支持                 | ✅ 支持               |

### showSourceCode: true 的执行方式

代码会被包装后插入到 DOM 中：

```html
<!-- 处理后的代码 -->
<script origin-src="http://localhost:8001/main.js">
  (function (window, self, globalThis) {
    with (window) {
      // 原始代码
      console.log('Hello World');
      //# sourceURL=http://localhost:8001/main.js
    }
  }).call(window['my-app'], window['my-app'], window['my-app'], window['my-app']);
</script>
```

### showSourceCode: false 的执行方式

代码通过 `new Function` 在内存中执行：

```javascript
// 内部实现
const scopedCode = `
  with(window) {
    try {
      ${code}
      //# sourceURL=${url}
    } catch(e) {
      console.error(e)
    }
  }
`;

new Function('window', 'location', 'history', scopedCode)(proxyWindow, location, history);
```

### Source Map 处理

无论哪种模式，BK-WeWeb 都会在代码末尾添加 sourceURL 注释：

```javascript
//# sourceURL=http://localhost:8001/main.js
```

这确保在浏览器 DevTools 中能够正确显示源文件。

## 使用场景

### 场景一：开发调试

开发环境需要更好的调试体验：

```typescript
// 根据环境配置
const isDev = import.meta.env.DEV;

<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :show-source-code="isDev"
/>
```

### 场景二：生产优化

生产环境追求性能：

```html
<!-- 生产环境使用内存执行 -->
<bk-weweb
  id="my-app"
  url="http://app.example.com/"
  :show-source-code="false"
/>
```

### 场景三：ES Module 脚本

对于 ES Module 类型的脚本，必须使用 `<script type="module">`：

```html
<!-- ES Module 脚本需要开启 showSourceCode -->
<bk-weweb
  id="vite-app"
  url="http://localhost:5173/"
  :show-source-code="true"
/>
```

### 场景四：调试第三方应用

需要调试第三方子应用时：

```html
<bk-weweb
  id="third-party"
  url="http://third-party.example.com/"
  :show-source-code="true"
/>
```

## 注意事项

### 1. ES Module 兼容性

ES Module 类型的脚本（`type="module"`）必须通过 `<script>` 标签执行：

```javascript
// 自动检测 module 类型并处理
if (script.isModule) {
  // 创建 <script type="module"> 标签
}
```

### 2. 内联脚本 CSP

如果页面有严格的 CSP（Content Security Policy），可能需要开启 `showSourceCode`：

```
Content-Security-Policy: script-src 'self' 'unsafe-eval'
```

- `showSourceCode: false` 需要 `'unsafe-eval'`
- `showSourceCode: true` 需要 `'unsafe-inline'`

### 3. 调试建议

```typescript
// 推荐配置：开发环境显示源码
const config = {
  showSourceCode: process.env.NODE_ENV === 'development',
};
```

### 4. 性能差异

在大型应用中，内存执行方式可能有轻微的性能优势，但在大多数场景下差异不明显。

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否在 DOM 中显示源码
   * @description 开启后脚本以 <script> 标签形式插入 DOM
   * @default false (微应用模式)
   * @default true (微模块模式)
   */
  showSourceCode?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [mode](./mode.md) - 运行模式
