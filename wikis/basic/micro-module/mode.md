# mode 属性（微模块）

## 概述

`mode` 属性用于指定运行模式。在微模块模式下，必须将 `mode` 设置为 `'js'` 或 `WewebMode.INSTANCE`。

## 基本信息

| 属性     | 值                               |
| -------- | -------------------------------- |
| 属性名   | `mode`                           |
| 类型     | `'js' \| WewebMode.INSTANCE`     |
| 是否必填 | **是**（微模块模式必须显式设置） |
| 默认值   | `'app'`                          |

## 使用方式

### Web Component

```html
<!-- 微模块模式 -->
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

// 使用枚举值
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
});

// 使用字符串
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: 'js',
});
```

## 模式对比

| 特性                  | 微应用模式 (app) | 微模块模式 (js) |
| --------------------- | ---------------- | --------------- |
| 入口类型              | HTML             | JS              |
| mode 设置             | 可省略（默认）   | 必须设置        |
| scopeJs 默认值        | `true`           | `false`         |
| showSourceCode 默认值 | `false`          | `true`          |
| 自动 render           | ❌               | ✅              |
| scopeLocation         | ✅ 支持          | ❌ 不支持       |

## 注意事项

### 1. 必须显式设置

微模块模式下必须设置 `mode="js"`：

```html
<!-- ✅ 正确：显式设置 mode -->
<bk-weweb
  id="widget"
  mode="js"
  url="http://example.com/widget.js"
/>

<!-- ❌ 错误：未设置 mode，会作为微应用加载 -->
<bk-weweb
  id="widget"
  url="http://example.com/widget.js"
/>
```

### 2. 与 loadInstance 配合

使用 `loadInstance` 时，mode 可以省略：

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

// loadInstance 内部会设置正确的 mode
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  // mode 可省略，loadInstance 会自动处理
});
```

## 类型定义

```typescript
enum WewebMode {
  APP = 'app',
  INSTANCE = 'js',
  CONFIG = 'config',
}

interface IJsModelProps {
  /**
   * 运行模式
   * @description 微模块模式必须设置为 'js' 或 WewebMode.INSTANCE
   */
  mode?: WewebMode;

  // ... 其他属性
}
```

## 相关属性

- [id](./id.md) - 模块标识符
- [url](./url.md) - 模块 URL
