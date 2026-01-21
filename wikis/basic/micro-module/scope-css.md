# scopeCss 属性（微模块）

## 概述

`scopeCss` 属性用于控制是否启用 **CSS 样式隔离**。在微模块模式下，默认开启。

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
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :scope-css="true"
/>

<!-- 关闭 CSS 隔离 -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :scope-css="false"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  scopeCss: true,
});
```

## 样式处理

微模块中动态添加的样式也会被处理：

```javascript
// 模块代码
const style = document.createElement('style');
style.textContent = '.widget-header { color: red; }';
document.head.appendChild(style);

// 处理后
// #my-widget-wrapper .widget-header { color: red; }
```

## 使用场景

### 场景一：样式隔离

防止模块样式影响主应用：

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  scopeCss: true, // 默认开启
});
```

### 场景二：共享样式

模块使用主应用的样式主题：

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'themed-widget',
  mode: WewebMode.INSTANCE,
  scopeCss: false, // 关闭隔离
});
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 是否启用 CSS 样式隔离
   * @default true
   */
  scopeCss?: boolean;

  // ... 其他属性
}
```

## 相关属性

- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [id](./id.md) - 模块标识符（用作 CSS 前缀）
