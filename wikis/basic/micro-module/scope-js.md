# scopeJs 属性（微模块）

## 概述

`scopeJs` 属性用于控制是否启用 **JavaScript 沙箱隔离**。在微模块模式下，默认关闭。

## 基本信息

| 属性     | 值                     |
| -------- | ---------------------- |
| 属性名   | `scopeJs` / `scope-js` |
| 类型     | `boolean`              |
| 是否必填 | 否                     |
| 默认值   | `false`（微模块模式）  |

## 与微应用的区别

| 模式   | scopeJs 默认值 | 原因                       |
| ------ | -------------- | -------------------------- |
| 微应用 | `true`         | 完整应用可能有全局变量冲突 |
| 微模块 | `false`        | 轻量模块通常不需要隔离     |

## 使用方式

### Web Component

```html
<!-- 开启 JS 隔离 -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :scope-js="true"
/>

<!-- 关闭 JS 隔离（默认） -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :scope-js="false"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

// 开启 JS 隔离
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  scopeJs: true,
});
```

## 使用场景

### 场景一：隔离插件

多个插件可能使用相同的全局变量名：

```typescript
// 插件 A 使用 window.myPlugin
await loadInstance({
  url: 'http://plugins/a.js',
  id: 'plugin-a',
  mode: WewebMode.INSTANCE,
  scopeJs: true, // 隔离
});

// 插件 B 也使用 window.myPlugin
await loadInstance({
  url: 'http://plugins/b.js',
  id: 'plugin-b',
  mode: WewebMode.INSTANCE,
  scopeJs: true, // 隔离
});
```

### 场景二：共享全局变量

模块需要访问主应用的全局变量：

```typescript
// 模块需要使用主应用的 Vue
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'shared-widget',
  mode: WewebMode.INSTANCE,
  scopeJs: false, // 关闭隔离，可访问主应用 window
});
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 是否启用 JavaScript 沙箱隔离
   * @default false
   */
  scopeJs?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeCss](./scope-css.md) - CSS 样式隔离
- [showSourceCode](./show-source-code.md) - 源码显示
