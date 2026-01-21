# render 规范

## 概述

在微模块模式下，BK-WeWeb 会执行远程 JS 模块并获取其导出实例。如果导出实例包含 `render` 方法，BK-WeWeb 会自动调用该方法将模块内容渲染到容器中。

## render 方法规范

### 基本签名

```typescript
interface ModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void | (() => void);
}
```

### 参数说明

| 参数        | 类型                      | 说明                    |
| ----------- | ------------------------- | ----------------------- |
| `container` | `HTMLElement`             | BK-WeWeb 分配的渲染容器 |
| `data`      | `Record<string, unknown>` | 主应用传递的数据        |

### 返回值

| 返回类型     | 说明               |
| ------------ | ------------------ |
| `void`       | 无返回值           |
| `() => void` | 可选，返回销毁函数 |

## 实现示例

### Vue 3 组件

```typescript
// chart-widget/src/index.ts
import { createApp, type App } from 'vue';
import ChartComponent from './ChartComponent.vue';

let app: App | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 创建 Vue 应用
    app = createApp(ChartComponent, {
      ...data, // 将数据作为 props 传递
    });

    // 挂载到容器
    app.mount(container);

    // 返回销毁函数
    return () => {
      app?.unmount();
      app = null;
    };
  },
};
```

### Vue 2 组件

```typescript
// legacy-widget/src/index.ts
import Vue from 'vue';
import LegacyComponent from './LegacyComponent.vue';

let instance: Vue | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 创建 Vue 2 实例
    const ComponentConstructor = Vue.extend(LegacyComponent);
    instance = new ComponentConstructor({
      propsData: data,
    });

    // 挂载
    instance.$mount();
    container.appendChild(instance.$el);

    // 返回销毁函数
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
// react-widget/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import MyComponent from './MyComponent';

let root: ReactDOM.Root | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 创建 React Root
    root = ReactDOM.createRoot(container);

    // 渲染组件
    root.render(<MyComponent {...data} />);

    // 返回销毁函数
    return () => {
      root?.unmount();
      root = null;
    };
  },
};
```

### 纯 JavaScript

```typescript
// vanilla-widget/src/index.ts
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { title = 'Widget', items = [] } = data as {
      title?: string;
      items?: Array<{ id: string; name: string }>;
    };

    // 创建 DOM
    container.innerHTML = `
      <div class="widget">
        <h3 class="widget-title">${title}</h3>
        <ul class="widget-list">
          ${items.map(item => `<li data-id="${item.id}">${item.name}</li>`).join('')}
        </ul>
      </div>
    `;

    // 添加事件监听
    const list = container.querySelector('.widget-list');
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'LI') {
        console.log('Clicked:', target.dataset.id);
      }
    };
    list?.addEventListener('click', handleClick);

    // 返回销毁函数
    return () => {
      list?.removeEventListener('click', handleClick);
      container.innerHTML = '';
    };
  },
};
```

### ECharts 图表

```typescript
// echarts-widget/src/index.ts
import * as echarts from 'echarts';

let chart: echarts.ECharts | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { options } = data as { options: echarts.EChartOption };

    // 初始化图表
    chart = echarts.init(container);
    chart.setOption(options);

    // 响应容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(container);

    // 返回销毁函数
    return () => {
      resizeObserver.disconnect();
      chart?.dispose();
      chart = null;
    };
  },
};
```

## 高级用法

### 导出多个方法

除了 `render`，还可以导出其他方法供主应用调用：

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

  // 执行方法
  doSomething() {
    // 自定义逻辑
  },
};
```

主应用中获取导出实例：

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

// 加载模块
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
});

// 通过回调获取导出实例
activated('my-widget', container, (instance, exportInstance) => {
  // exportInstance 就是模块导出的对象
  console.log(exportInstance);

  // 调用模块方法
  exportInstance?.update({ newData: true });
  const state = exportInstance?.getState();
});
```

### 支持 TypeScript 类型

```typescript
// types.ts
export interface WidgetData {
  title: string;
  items: Array<{ id: string; name: string }>;
}

export interface WidgetExport {
  render: (container: HTMLElement, data: WidgetData) => () => void;
  update: (data: Partial<WidgetData>) => void;
  getState: () => WidgetData;
}

// index.ts
import type { WidgetData, WidgetExport } from './types';

const widget: WidgetExport = {
  render(container, data) {
    // ...
    return () => {
      /* cleanup */
    };
  },

  update(data) {
    // ...
  },

  getState() {
    return {
      /* ... */
    };
  },
};

export default widget;
```

### 异步渲染

```typescript
export default {
  async render(container: HTMLElement, data: Record<string, unknown>) {
    // 显示加载状态
    container.innerHTML = '<div class="loading">Loading...</div>';

    // 异步加载数据
    const response = await fetch('/api/data');
    const result = await response.json();

    // 渲染内容
    container.innerHTML = `<div class="content">${result.content}</div>`;

    return () => {
      container.innerHTML = '';
    };
  },
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
      external: ['vue'], // 外部依赖
      output: {
        globals: {
          vue: 'Vue',
        },
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

### Rollup

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/widget.umd.js',
      format: 'umd',
      name: 'MyWidget',
    },
    {
      file: 'dist/widget.esm.js',
      format: 'es',
    },
  ],
  external: ['vue'],
  plugins: [nodeResolve(), typescript()],
};
```

## 注意事项

1. **容器 ID**

   BK-WeWeb 会为容器自动生成 ID：`${moduleName}-wrapper`

2. **样式处理**

   模块中动态添加的样式会被 CSS 作用域隔离处理

3. **销毁清理**

   务必返回销毁函数，清理事件监听、定时器等

4. **错误处理**

   render 方法中的错误应该被捕获并处理

```typescript
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    try {
      // 渲染逻辑
    } catch (error) {
      console.error('Widget render error:', error);
      container.innerHTML = '<div class="error">渲染失败</div>';
    }
  },
};
```

## 相关文档

- [微模块概述](./README.md)
- [data 属性](./data.md)
- [scopeJs 属性](./scope-js.md)
