# 微模块配置详解

## 概述

微模块模式加载远程 JavaScript 模块（JS Entry），适用于远程组件、插件系统等场景。与微应用不同，微模块不需要完整 HTML 页面。

## 与微应用的区别

| 特性                | 微应用    | 微模块    |
| ------------------- | --------- | --------- |
| 入口类型            | HTML 文件 | JS 文件   |
| mode 属性           | 默认/不填 | 必须 'js' |
| scopeJs 默认值      | true      | false     |
| showSourceCode 默认 | false     | true      |
| scopeLocation 支持  | ✅        | ❌        |
| render 自动调用     | ❌        | ✅        |
| 导出实例获取        | ❌        | ✅        |
| 适用场景            | 完整应用  | 组件/插件 |

## 配置属性

### mode（必填 'js'）

微模块必须设置 mode 为 'js'。

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: 'js', // 或 WewebMode.INSTANCE
});
```

### url（必填）

JS 模块入口 URL。

```typescript
await loadInstance({ url: 'http://cdn.example.com/widget.js', mode: 'js' });
await loadInstance({ url: 'http://cdn.example.com/widget.ts', mode: 'js' }); // TS 自动作为 ESM 处理
```

### container

挂载容器，loadInstance 需要传入。

```typescript
await loadInstance({
  url: '...',
  id: 'my-module',
  mode: 'js',
  container: document.getElementById('container'),
});
```

### scopeJs（默认 false）

微模块默认不开启 JS 沙箱。需要隔离时手动开启。

```typescript
// 插件间需要隔离
await loadInstance({
  url: '...',
  mode: 'js',
  scopeJs: true,
});
```

### scopeCss（默认 true）

CSS 样式隔离，模块动态添加的样式会被隔离。

### keepAlive（默认 false）

缓存模式，使用 activated/deactivated 切换。

```typescript
await loadInstance({
  url: '...',
  id: 'chart',
  mode: 'js',
  container,
  keepAlive: true,
});

// 切换
activated('chart', container);
deactivated('chart');
```

### data

传递给模块的数据，会作为 render 方法的第二个参数。

```typescript
await loadInstance({
  url: '...',
  mode: 'js',
  data: { chartType: 'line', title: '销售趋势' },
});
```

### initSource

模块加载前预加载的资源。

```typescript
await loadInstance({
  url: 'http://cdn.example.com/chart-widget.js',
  mode: 'js',
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});
```

## render 规范

微模块需导出包含 render 方法的对象：

```typescript
interface ModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void | (() => void);
}
```

### Vue 3 组件

```typescript
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

    return () => {
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
    chart = echarts.init(container);
    chart.setOption(data.options);

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

除 render 外可导出其他方法供主应用调用：

```typescript
export default {
  render(container, data) {
    /* ... */
  },
  update(newData) {
    /* 更新数据 */
  },
  getState() {
    return {
      /* 当前状态 */
    };
  },
  doSomething() {
    /* 自定义方法 */
  },
};
```

主应用获取导出实例：

```typescript
activated('my-module', container, (instance, exportInstance) => {
  exportInstance?.update({ newData: true });
  const state = exportInstance?.getState();
});
```

## 构建配置

### Vite

```typescript
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
      output: { globals: { vue: 'Vue' } },
    },
  },
});
```

### Webpack

```javascript
module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'widget.js',
    library: { name: 'MyWidget', type: 'umd', export: 'default' },
    globalObject: 'this',
  },
  externals: { vue: 'Vue' },
};
```

## 使用场景

### 跨框架组件

```typescript
// 在 Vue3 中使用 Vue2 组件
await loadInstance({
  url: 'http://cdn.example.com/vue2-component.js',
  id: 'vue2-widget',
  mode: 'js',
  initSource: ['https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'],
});
```

### 插件系统

```typescript
for (const plugin of userPlugins) {
  await loadInstance({
    url: plugin.url,
    id: plugin.id,
    mode: 'js',
    scopeJs: true, // 插件间隔离
  });
}
```

### 仪表盘微件

```typescript
const widgets = ['chart', 'table', 'map'];
for (const widget of widgets) {
  await loadInstance({
    url: `http://widgets.example.com/${widget}.js`,
    id: `widget-${widget}`,
    mode: 'js',
    container: document.getElementById(`${widget}-container`),
  });
}
```

## 完整示例

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 加载
await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('chart-container'),
  scopeJs: true,
  scopeCss: true,
  keepAlive: true,
  data: { chartType: 'line', title: '销售趋势' },
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

// 激活并获取导出实例
activated('chart-widget', container, (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);
});

// 停用
deactivated('chart-widget');
```
