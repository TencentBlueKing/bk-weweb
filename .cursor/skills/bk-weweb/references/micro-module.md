# 微模块配置详解

## 目录

- [概述](#概述)
- [配置属性](#配置属性)
- [render 规范](#render-规范)
- [Web Component 方式](#web-component-方式)
- [Hooks API 方式](#hooks-api-方式)
- [框架集成示例](#框架集成示例)
- [构建配置](#构建配置)
- [GitHub 文档](#github-文档)

## 概述

微模块模式用于加载**远程 JavaScript 模块**（JS Entry）。与微应用不同，微模块只需要一个可执行的 JS 文件作为入口。

适用场景：

- 跨框架组件（在 Vue3 中使用 Vue2 组件，或 React 组件）
- 插件系统（用户自定义插件、第三方插件动态加载）
- 远程组件（根据配置动态加载不同组件）
- 仪表盘微件（图表、表格、地图等独立微件）
- 低代码平台（动态加载渲染器、自定义组件）

## 配置属性

| 属性           | 类型      | 默认值  | 必填 | 说明             |
| -------------- | --------- | ------- | ---- | ---------------- |
| url            | `string`  | -       | 是   | JS 模块 URL      |
| id             | `string`  | -       | 是   | 模块唯一标识符   |
| mode           | `string`  | -       | 是   | 必须设为 `'js'`  |
| scopeJs        | `boolean` | `false` | 否   | JS 沙箱隔离      |
| scopeCss       | `boolean` | `true`  | 否   | CSS 样式隔离     |
| keepAlive      | `boolean` | `false` | 否   | 缓存模式         |
| showSourceCode | `boolean` | `true`  | 否   | 显示源码         |
| data           | `object`  | `{}`    | 否   | 传递给模块的数据 |
| initSource     | `array`   | `[]`    | 否   | 依赖资源列表     |

### 与微应用的区别

| 特性               | 微应用模式 | 微模块模式 |
| ------------------ | ---------- | ---------- |
| 入口类型           | HTML 文件  | JS 文件    |
| scopeJs 默认值     | `true`     | `false`    |
| scopeLocation 支持 | ✅         | ❌         |
| render 自动调用    | ❌         | ✅         |
| 导出实例获取       | ❌         | ✅         |

## render 规范

微模块需导出包含 `render` 方法的对象：

```typescript
interface ModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void | (() => void);
}
```

### 基础示例

```typescript
// widget.ts
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { title = 'Widget' } = data;
    container.innerHTML = `<div class="widget"><h3>${title}</h3></div>`;

    // 返回销毁函数（可选）
    return () => {
      container.innerHTML = '';
    };
  },
};
```

### Vue 3 组件

```typescript
// vue3-widget/src/index.ts
import { createApp, type App } from 'vue';
import ChartComponent from './ChartComponent.vue';

let app: App | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    app = createApp(ChartComponent, { ...data });
    app.mount(container);

    return () => {
      app?.unmount();
      app = null;
    };
  },
};
```

### React 组件

```tsx
// react-widget/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import MyComponent from './MyComponent';

let root: ReactDOM.Root | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    root = ReactDOM.createRoot(container);
    root.render(<MyComponent {...data} />);

    return () => {
      root?.unmount();
      root = null;
    };
  },
};
```

### 导出多个方法

```typescript
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 渲染逻辑
  },

  // 更新数据
  update(newData: Record<string, unknown>) {
    // 更新逻辑
  },

  // 获取状态
  getState() {
    return {
      /* 当前状态 */
    };
  },

  // 自定义方法
  doSomething() {
    // 自定义逻辑
  },
};
```

## Web Component 方式

```vue
<template>
  <bk-weweb
    id="chart-widget"
    mode="js"
    url="http://localhost:8002/widget.js"
    :scope-js="true"
    :scope-css="true"
    :data="JSON.stringify({ chartType: 'line', title: '销售趋势' })"
  />
</template>

<script setup>
  import '@blueking/bk-weweb';
</script>
```

## Hooks API 方式

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 加载微模块
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE, // 或 'js'
  container: document.getElementById('container'),
  scopeJs: true,
  scopeCss: true,
  data: {
    chartType: 'line',
    title: '销售趋势',
  },
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

// 激活模块（可获取导出实例）
activated('chart-widget', container, (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);

  // 调用模块导出的方法
  exportInstance?.update({ newData: true });
  const state = exportInstance?.getState();
});

// 停用模块
deactivated('chart-widget');
```

## 框架集成示例

### Vue 3

```vue
<template>
  <div
    ref="containerRef"
    class="module-wrapper"
  ></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

  const containerRef = ref<HTMLElement | null>(null);
  const moduleId = 'my-module';

  onMounted(async () => {
    await loadInstance({
      url: 'http://localhost:8002/widget.js',
      id: moduleId,
      mode: WewebMode.INSTANCE,
      container: containerRef.value,
      scopeJs: true,
      data: { type: 'chart' },
    });

    activated(moduleId, containerRef.value!);
  });

  onBeforeUnmount(() => {
    deactivated(moduleId);
  });
</script>
```

### React

```tsx
import { useRef, useEffect } from 'react';
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

const MicroModuleContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleId = 'my-module';

  useEffect(() => {
    const loadModule = async () => {
      await loadInstance({
        url: 'http://localhost:8002/widget.js',
        id: moduleId,
        mode: WewebMode.INSTANCE,
        container: containerRef.current,
        scopeJs: true,
      });

      if (containerRef.current) {
        activated(moduleId, containerRef.current);
      }
    };

    loadModule();

    return () => {
      deactivated(moduleId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '400px' }}
    />
  );
};
```

## 构建配置

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyWidget',
      formats: ['umd', 'es'],
      fileName: format => `widget.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
});
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'widget.js',
    library: {
      name: 'MyWidget',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  externals: {
    vue: 'Vue',
  },
};
```

## GitHub 文档

详细文档请访问：

- [微模块概述](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-module/README.md)
- [render 规范](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-module/render-specification.md)
- [scopeJs 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-module/scope-js.md)
- [data 属性](https://github.com/TencentBlueKing/bk-weweb/blob/main/wikis/basic/micro-module/data.md)
