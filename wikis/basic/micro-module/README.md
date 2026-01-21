# 微模块模式

## 概述

微模块模式是 BK-WeWeb 的另一种核心运行模式，用于加载**远程 JavaScript 模块**。与微应用模式不同，微模块只需要一个可执行的 JS 文件作为入口，而不需要完整的 HTML 页面。

## 什么是微模块

微模块是一个独立的 JavaScript 模块文件，它可以：

- 导出组件或功能
- 包含自己的样式（通过 JS 动态注入）
- 独立开发和部署
- 作为插件或远程组件使用

BK-WeWeb 会加载并执行这个 JS 模块，获取其导出的内容，并在隔离环境中运行。

## 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│  1. 获取 JS 模块                                             │
│     fetch('http://cdn.example.com/widget.js')               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 创建沙箱环境（可选）                                      │
│     - 创建 proxyWindow                                       │
│     - 设置 CSS 作用域                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 执行模块                                                  │
│     - 执行 JS 代码                                           │
│     - 获取导出实例                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 调用 render 方法（如果存在）                               │
│     - 创建容器 DOM                                            │
│     - 调用 exportInstance.render(container, data)           │
└─────────────────────────────────────────────────────────────┘
```

## 基础使用

### Web Component 方式

```html
<bk-weweb
  id="my-module"
  mode="js"
  url="http://localhost:8002/widget.js"
></bk-weweb>
```

### Hooks 方式

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 加载模块
const instance = await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  scopeJs: true,
  scopeCss: true,
});

// 激活模块
activated('my-module', document.getElementById('container'));

// 停用模块
deactivated('my-module');
```

## 配置属性

| 属性                                    | 类型                      | 默认值  | 必填   | 说明              |
| --------------------------------------- | ------------------------- | ------- | ------ | ----------------- |
| [id](./id.md)                           | `string`                  | -       | 是     | 模块唯一标识符    |
| [url](./url.md)                         | `string`                  | -       | **是** | JS 模块 URL       |
| [mode](./mode.md)                       | `'js'`                    | -       | **是** | 必须设置为 `'js'` |
| [scopeJs](./scope-js.md)                | `boolean`                 | `false` | 否     | JS 沙箱隔离       |
| [scopeCss](./scope-css.md)              | `boolean`                 | `true`  | 否     | CSS 样式隔离      |
| [keepAlive](./keep-alive.md)            | `boolean`                 | `false` | 否     | 缓存模式          |
| [showSourceCode](./show-source-code.md) | `boolean`                 | `true`  | 否     | 显示源码          |
| [data](./data.md)                       | `Record<string, unknown>` | `{}`    | 否     | 传递数据          |
| [initSource](./init-source.md)          | `string[]`                | `[]`    | 否     | 初始化资源        |

## 模块导出规范

为了让 BK-WeWeb 正确渲染模块内容，JS 模块应导出包含 `render` 方法的对象。详见 [render 规范](./render-specification.md)。

```typescript
// 标准导出格式
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    // 渲染逻辑
  },
};
```

## 完整配置示例

```typescript
// Web Component 方式
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/chart.js"
  :scope-js="true"
  :scope-css="true"
  :keep-alive="false"
  :show-source-code="true"
  :data="JSON.stringify({
    chartType: 'line',
    title: '销售趋势'
  })"
/>

// Hooks 方式
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('chart-container'),
  scopeJs: true,
  scopeCss: true,
  keepAlive: false,
  showSourceCode: true,
  data: {
    chartType: 'line',
    title: '销售趋势'
  },
  initSource: [
    'https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'
  ]
});

activated('chart-widget', document.getElementById('chart-container'));
```

## 与微应用模式的区别

| 特性                  | 微应用模式 | 微模块模式 |
| --------------------- | ---------- | ---------- |
| 入口类型              | HTML 文件  | JS 文件    |
| scopeJs 默认值        | `true`     | `false`    |
| showSourceCode 默认值 | `false`    | `true`     |
| scopeLocation 支持    | ✅         | ❌         |
| render 自动调用       | ❌         | ✅         |
| 导出实例获取          | ❌         | ✅         |
| 适用场景              | 完整应用   | 组件/插件  |

## 适用场景

### 1. 跨框架组件

在 Vue3 项目中使用 Vue2 组件：

```typescript
// Vue2 组件构建为模块
await loadInstance({
  url: 'http://cdn.example.com/vue2-component.js',
  id: 'vue2-widget',
  mode: WewebMode.INSTANCE,
  initSource: ['https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'],
});
```

### 2. 插件系统

用户自定义插件：

```typescript
// 动态加载用户插件
for (const plugin of userPlugins) {
  await loadInstance({
    url: plugin.url,
    id: plugin.id,
    mode: WewebMode.INSTANCE,
    scopeJs: true, // 插件间隔离
  });
}
```

### 3. 远程组件

动态加载远程组件：

```typescript
// 根据配置加载不同组件
const componentUrl = await getComponentUrl(componentType);
await loadInstance({
  url: componentUrl,
  id: `component-${componentType}`,
  mode: WewebMode.INSTANCE,
});
```

### 4. 微件/Widget

仪表盘微件：

```typescript
// 加载仪表盘微件
const widgets = ['chart', 'table', 'map', 'calendar'];
for (const widget of widgets) {
  await loadInstance({
    url: `http://widgets.example.com/${widget}.js`,
    id: `widget-${widget}`,
    mode: WewebMode.INSTANCE,
  });
}
```

## 注意事项

1. **mode 必填**

   微模块模式必须显式设置 `mode="js"`。

2. **模块格式**

   支持 UMD、IIFE、ES Module 等格式。

3. **TS 文件处理**

   URL 以 `.ts` 结尾时，会自动作为 ES Module 处理。

4. **样式处理**

   模块中动态添加的样式也会被作用域隔离。

## 相关链接

- [微应用模式](../micro-app/README.md)
- [render 规范](./render-specification.md)
- [Hooks API](../hooks/README.md)
