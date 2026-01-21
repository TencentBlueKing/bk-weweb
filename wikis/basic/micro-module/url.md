# url 属性（微模块）

## 概述

`url` 属性用于指定微模块的 **JavaScript 文件地址**。与微应用不同，微模块的 URL 直接指向可执行的 JS 文件。

## 基本信息

| 属性     | 值       |
| -------- | -------- |
| 属性名   | `url`    |
| 类型     | `string` |
| 是否必填 | **是**   |
| 默认值   | -        |

## 使用方式

### Web Component

```html
<!-- 加载远程 JS 模块 -->
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
/>

<!-- CDN 地址 -->
<bk-weweb
  id="analytics"
  mode="js"
  url="https://cdn.example.com/modules/analytics.umd.js"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
});
```

## 支持的文件类型

| 后缀   | 类型       | 说明                    |
| ------ | ---------- | ----------------------- |
| `.js`  | JavaScript | 标准 JS 文件            |
| `.mjs` | ES Module  | ES 模块文件             |
| `.ts`  | TypeScript | 自动作为 ES Module 处理 |

## 模块格式支持

### UMD 格式

```javascript
// widget.umd.js
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.MyWidget = factory());
})(this, function () {
  return {
    render(container, data) {
      // ...
    },
  };
});
```

### ES Module 格式

```javascript
// widget.esm.js
export default {
  render(container, data) {
    // ...
  },
};
```

### IIFE 格式

```javascript
// widget.iife.js
var MyWidget = (function () {
  return {
    render(container, data) {
      // ...
    },
  };
})();
```

## 使用场景

### 场景一：开发环境

```typescript
// Vite 开发服务器
await loadInstance({
  url: 'http://localhost:5173/src/widget/index.ts',
  id: 'dev-widget',
  mode: WewebMode.INSTANCE,
});
```

### 场景二：生产环境

```typescript
// CDN 部署
await loadInstance({
  url: 'https://cdn.example.com/widgets/chart/1.0.0/index.umd.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
});
```

### 场景三：动态版本

```typescript
async function loadWidget(name: string, version: string) {
  const url = `https://cdn.example.com/widgets/${name}/${version}/index.js`;

  await loadInstance({
    url,
    id: `${name}-${version}`,
    mode: WewebMode.INSTANCE,
  });
}
```

## 注意事项

### 1. CORS 配置

确保 JS 文件服务器允许跨域：

```
Access-Control-Allow-Origin: *
```

### 2. 文件类型

URL 必须指向有效的 JavaScript 文件：

```typescript
// ✅ 正确
url: 'http://localhost:8002/widget.js';
url: 'http://localhost:8002/widget.umd.js';
url: 'http://localhost:8002/widget.esm.mjs';

// ❌ 错误：不支持 HTML
url: 'http://localhost:8002/index.html';
```

### 3. 构建输出

确保模块构建输出正确的格式：

```typescript
// vite.config.ts
export default {
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['umd', 'es'],
      fileName: format => `widget.${format}.js`,
    },
  },
};
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * JS 模块 URL
   * @required
   */
  url: string;

  // ... 其他属性
}
```

## 相关属性

- [id](./id.md) - 模块标识符
- [mode](./mode.md) - 运行模式
- [initSource](./init-source.md) - 依赖资源
