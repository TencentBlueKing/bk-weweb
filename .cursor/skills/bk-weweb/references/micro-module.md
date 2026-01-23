# 微模块配置详解

## 概述

微模块模式用于加载远程 JavaScript 模块（JS Entry），适用于远程组件、插件系统等场景。

## 与微应用的区别

| 特性                  | 微应用 (app) | 微模块 (js)       |
| --------------------- | ------------ | ----------------- |
| 入口类型              | HTML         | JS                |
| mode 设置             | 默认         | **必须设为 'js'** |
| scopeJs 默认值        | `true`       | `false`           |
| showSourceCode 默认值 | `false`      | `true`            |
| scopeLocation 支持    | ✅           | ❌                |
| render 自动调用       | ❌           | ✅                |
| 导出实例获取          | ❌           | ✅                |

## 属性详解

### mode (必填)

必须设置为 `'js'`。

```vue
<bk-weweb mode="js" url="..." id="..." />
```

### url (必填)

JS 模块的 URL。

```vue
<bk-weweb mode="js" url="http://localhost:8002/widget.js" id="..." />
```

### id (必填)

模块唯一标识符。

```vue
<bk-weweb mode="js" url="..." id="chart-widget" />
```

### 其他属性

| 属性             | 默认值  | 说明         |
| ---------------- | ------- | ------------ |
| `scopeJs`        | `false` | JS 沙箱隔离  |
| `scopeCss`       | `true`  | CSS 样式隔离 |
| `keepAlive`      | `false` | 缓存模式     |
| `showSourceCode` | `true`  | 显示源码     |
| `data`           | -       | 传递数据     |
| `initSource`     | -       | 初始化资源   |

## render 规范

微模块需导出包含 `render` 方法的对象：

```typescript
interface ModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void | (() => void);
  // 可选的其他方法
  update?: (data: Record<string, unknown>) => void;
  getState?: () => Record<string, unknown>;
  destroy?: () => void;
}
```

## 模块实现示例

### Vue 3 组件

```typescript
// chart-widget/src/index.ts
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

### Vue 2 组件

```typescript
import Vue from 'vue';
import LegacyComponent from './LegacyComponent.vue';

let instance: Vue | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const Constructor = Vue.extend(LegacyComponent);
    instance = new Constructor({ propsData: data });
    instance.$mount();
    container.appendChild(instance.$el);

    return () => {
      instance?.$destroy();
      container.innerHTML = '';
      instance = null;
    };
  },
};
```

### React 组件

```tsx
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

### 纯 JavaScript

```typescript
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { title = 'Widget', items = [] } = data;

    container.innerHTML = `
      <div class="widget">
        <h3>${title}</h3>
        <ul>${items.map(item => `<li>${item.name}</li>`).join('')}</ul>
      </div>
    `;

    const handleClick = (e: Event) => {
      /* ... */
    };
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
      container.innerHTML = '';
    };
  },
};
```

### ECharts 图表

```typescript
import * as echarts from 'echarts';

let chart: echarts.ECharts | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { options } = data;

    chart = echarts.init(container);
    chart.setOption(options);

    const resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart?.dispose();
      chart = null;
    };
  },
};
```

## 导出多个方法

```typescript
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 渲染逻辑
  },

  update(newData: Record<string, unknown>) {
    // 更新数据
  },

  getState() {
    return {
      /* 当前状态 */
    };
  },

  doSomething() {
    // 自定义方法
  },
};
```

## 获取导出实例

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
});

// 通过回调获取导出实例
activated('my-widget', container, (instance, exportInstance) => {
  console.log(exportInstance);

  // 调用模块方法
  exportInstance?.update({ newData: true });
  const state = exportInstance?.getState();
});
```

## 完整使用示例

### Web Component 方式

```vue
<template>
  <bk-weweb
    id="chart-widget"
    mode="js"
    url="http://localhost:8002/chart.js"
    :scope-js="true"
    :scope-css="true"
    :keep-alive="false"
    :show-source-code="true"
    :data="JSON.stringify({ chartType: 'line', title: '销售趋势' })"
  />
</template>
```

### Hooks 方式

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

const container = document.getElementById('container');

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container,
  scopeJs: true,
  scopeCss: true,
  keepAlive: false,
  showSourceCode: true,
  data: {
    chartType: 'line',
    title: '销售趋势',
  },
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

activated('chart-widget', container);

// 停用
deactivated('chart-widget');
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
  externals: { vue: 'Vue' },
};
```

## 适用场景

1. **跨框架组件**：在 Vue3 项目中使用 Vue2 组件
2. **插件系统**：动态加载用户自定义插件
3. **远程组件**：根据配置动态加载不同组件
4. **微件/Widget**：仪表盘微件、可视化组件
