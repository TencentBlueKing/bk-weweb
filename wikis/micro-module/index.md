# 微模块 Micro Module

微模块模式（`mode="js"`）用于加载一个**远程 JS 模块**。它的入口是一个 JS 地址，框架执行该模块后，调用其导出对象的 `render(container, data)` 方法把内容渲染进容器。适合远程组件、图表、插件等"组件级"复用场景。

与微应用最大的区别：微应用入口是 HTML、整页接入；微模块入口是 JS、按约定的 [render 规范](./render-specification) 渲染。

## 两种用法

::: code-group

```html [Web Component]
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
></bk-weweb>
```

```ts [Hooks API]
import { loadInstance, mount } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart-widget',
  data: { theme: 'dark' },
});
mount('chart-widget', document.getElementById('box')!, (_inst, api) => {
  // api 即模块导出对象
});
```

:::

> `mode="js"` 必填，否则会被当作微应用处理。`id` 也建议必填——JS bundle 常需复用，靠 `id` 作为缓存键区分实例。

## 属性速查

下表为通过 **Hooks API（`loadInstance`）** 传入时的默认值（以 `MicroInstanceModel` 构造函数为准）：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**，JS 模块 URL |
| `id` | `string` | 随机串 | **建议必填**，缓存键 |
| `mode` | `'js'` | — | **必填**，固定为 `'js'` |
| [`scopeJs`](./scope-js) | `boolean` | `true` | JS 沙箱隔离 |
| [`scopeCss`](./scope-css) | `boolean` | `true` | CSS 样式隔离 |
| [`keepAlive`](./keep-alive) | `boolean` | `false` | 缓存模式 |
| [`showSourceCode`](./show-source-code) | `boolean` | `true` | 显示源码 |
| `data` | `object` | `{}` | 传给模块的数据（透传给 `render`） |
| `initSource` | `string[]` | `[]` | 初始化资源 |

::: tip 与微应用的默认值差异
微模块的 `showSourceCode` 默认 **`true`**（微应用为 `false`）。`scopeJs` 在构造函数中同样默认 `true`（`props.scopeJs ?? true`）。
:::

## 渲染流程

微模块挂载（`mount`）时，内部按以下顺序工作：

1. 清空容器，创建一个包裹元素 `<div id="{name}-wrapper">`；
2. 注入模块样式（若有）；
3. 激活沙箱；
4. 执行模块脚本，拿到导出对象 `exportInstance`；
5. 调用 `exportInstance.render(wrapper, data)` 完成渲染；
6. 触发 `mount` 的回调，第二个参数即 `exportInstance`。

因此你的远程模块必须遵循 [render 导出规范](./render-specification)。

## 基础属性

### url（必填）
远程 JS 模块地址。

### id（建议必填）
缓存键。微模块的 `appCacheKey = id || name`，不填 `id` 时用随机名，难以复用，建议显式指定。

### data
透传给 `render(container, data)` 的数据对象。标签用法下为 JSON 字符串。

### initSource
额外初始化资源列表（`string | string[]`）。
