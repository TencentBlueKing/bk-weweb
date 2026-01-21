# mode 属性

## 概述

`mode` 属性用于指定 BK-WeWeb 的**运行模式**，决定了加载和执行资源的方式。

## 基本信息

| 属性     | 值                          |
| -------- | --------------------------- |
| 属性名   | `mode`                      |
| 类型     | `'app' \| 'js' \| 'config'` |
| 是否必填 | 否                          |
| 默认值   | `'app'`                     |

## 模式说明

| 模式       | 枚举值                          | 说明                     |
| ---------- | ------------------------------- | ------------------------ |
| 微应用模式 | `WewebMode.APP` / `'app'`       | 加载完整的 HTML 入口应用 |
| 微模块模式 | `WewebMode.INSTANCE` / `'js'`   | 加载单个 JS 模块文件     |
| 配置模式   | `WewebMode.CONFIG` / `'config'` | 保留模式（暂未使用）     |

## 使用方式

### Web Component

```html
<!-- 微应用模式（默认） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  mode="app"
/>

<!-- 微模块模式 -->
<bk-weweb
  id="my-module"
  url="http://localhost:8002/index.js"
  mode="js"
/>
```

### Hooks API

```typescript
import { load, loadApp, loadInstance, WewebMode } from '@blueking/bk-weweb';

// 方式一：使用 load 函数 + mode 参数
await load({
  url: 'http://localhost:8001/',
  id: 'my-app',
  mode: WewebMode.APP, // 或 'app'
});

await load({
  url: 'http://localhost:8002/index.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE, // 或 'js'
});

// 方式二：使用专门的加载函数（推荐）
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

await loadInstance({
  url: 'http://localhost:8002/index.js',
  id: 'my-module',
});
```

## 详细说明

### 微应用模式 (app)

适用于加载完整的远程应用，特点：

- URL 指向 HTML 入口文件
- 自动解析 HTML 中的 CSS 和 JS 资源
- 支持完整的应用生命周期
- 支持路由隔离 (`scopeLocation`)
- 默认开启 JS 沙箱隔离

```typescript
// 典型配置
<bk-weweb
  id="dashboard"
  mode="app"
  url="http://localhost:8001/"
  :scope-js="true"
  :scope-css="true"
  :scope-location="true"
/>
```

### 微模块模式 (js)

适用于加载远程 JS 模块，特点：

- URL 指向 JS 文件
- 自动执行模块并获取导出实例
- 支持 render 函数自动挂载
- 默认不开启 JS 沙箱隔离
- 不支持路由隔离

```typescript
// 典型配置
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :scope-js="true"
  :scope-css="true"
/>
```

### 模式差异对比

| 特性               | 微应用模式 (app) | 微模块模式 (js) |
| ------------------ | ---------------- | --------------- |
| 入口类型           | HTML 文件        | JS 文件         |
| scopeJs 默认值     | `true`           | `false`         |
| scopeLocation 支持 | ✅               | ❌              |
| setShadowDom 支持  | ✅               | ✅              |
| 自动 render 调用   | ❌               | ✅              |
| 导出实例获取       | ❌               | ✅              |

## 类型定义

```typescript
/**
 * WeWeb 运行模式枚举
 */
export enum WewebMode {
  /** 微应用模式 - 加载完整 HTML 应用 */
  APP = 'app',

  /** 微模块模式 - 加载 JS 模块 */
  INSTANCE = 'js',

  /** 配置模式 - 保留 */
  CONFIG = 'config',
}

interface IBaseModelProps {
  /**
   * 运行模式
   * @default WewebMode.APP
   */
  mode?: WewebMode;

  // ... 其他属性
}
```

## 使用场景

### 场景一：选择合适的模式

```typescript
// 独立部署的完整应用 → 微应用模式
<bk-weweb mode="app" url="http://app.example.com/" />

// 远程组件/插件 → 微模块模式
<bk-weweb mode="js" url="http://cdn.example.com/widget.js" />
```

### 场景二：动态切换模式

```vue
<template>
  <bk-weweb
    :id="config.id"
    :mode="config.mode"
    :url="config.url"
    :key="config.id"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  interface AppConfig {
    id: string;
    mode: 'app' | 'js';
    url: string;
  }

  const config = ref<AppConfig>({
    id: 'dynamic-app',
    mode: 'app',
    url: 'http://localhost:8001/',
  });

  function loadAsModule() {
    config.value = {
      id: 'dynamic-module',
      mode: 'js',
      url: 'http://localhost:8002/index.js',
    };
  }
</script>
```

## 相关属性

- [url](./url.md) - 入口地址
- [scopeJs](./scope-js.md) - JS 沙箱隔离
- [scopeLocation](./scope-location.md) - 路由隔离（仅微应用模式）

## 相关文档

- [微应用模式详解](./README.md)
- [微模块模式详解](../micro-module/README.md)
