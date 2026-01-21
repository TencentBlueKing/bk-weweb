# showSourceCode 属性（微模块）

## 概述

`showSourceCode` 属性用于控制模块代码的**执行方式**。微模块模式下默认开启。

## 基本信息

| 属性     | 值                                    |
| -------- | ------------------------------------- |
| 属性名   | `showSourceCode` / `show-source-code` |
| 类型     | `boolean`                             |
| 是否必填 | 否                                    |
| 默认值   | `true`（微模块模式）                  |

## 与微应用的区别

| 模式   | showSourceCode 默认值 | 原因                               |
| ------ | --------------------- | ---------------------------------- |
| 微应用 | `false`               | 大型应用代码多，使用内存执行更高效 |
| 微模块 | `true`                | 轻量模块，使用 script 标签便于调试 |

## 使用方式

### Web Component

```html
<!-- 显示源码（默认） -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :show-source-code="true"
/>

<!-- 内存执行 -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :show-source-code="false"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  showSourceCode: true,
});
```

## 使用场景

### 场景一：开发调试

开发环境保持源码可见：

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'dev-widget',
  mode: WewebMode.INSTANCE,
  showSourceCode: true, // 便于调试
});
```

### 场景二：ES Module

ES Module 必须通过 script 标签执行：

```typescript
await loadInstance({
  url: 'http://localhost:5173/src/widget/index.ts',
  id: 'esm-widget',
  mode: WewebMode.INSTANCE,
  showSourceCode: true, // ESM 必须开启
});
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 是否在 DOM 中显示源码
   * @default true
   */
  showSourceCode?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeJs](./scope-js.md) - JS 沙箱隔离
