# 微应用 Micro App

微应用模式（`mode="app"`，默认）用于加载一个**完整的远程应用**。它的入口是一个 HTML 地址，框架会拉取并解析 HTML，提取其中的 `<script>` / `<style>`，在隔离环境中执行，并把内容渲染到容器。

## 两种用法

::: code-group

```html [Web Component]
<bk-weweb
  id="child-app"
  url="http://localhost:8001/"
></bk-weweb>
```

```ts [Hooks API]
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'child-app',
  scopeJs: true,
  scopeCss: true,
});
mount('child-app', document.getElementById('container')!);
```

:::

## 属性速查

下表为通过 **Hooks API（`loadApp`）** 传入时的默认值（以 `MicroAppModel` 构造函数为准）：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**，应用入口 URL |
| `id` | `string` | 随机串 | 唯一标识；同时作为缓存键与挂载键 |
| `mode` | `'app'` | `'app'` | 运行模式，微应用可省略 |
| [`scopeJs`](./scope-js) | `boolean` | `true` | JS 沙箱隔离 |
| [`scopeCss`](./scope-css) | `boolean` | `true` | CSS 样式隔离 |
| [`scopeLocation`](./scope-location) | `boolean` | `false` | 路由隔离（启用隐藏 iframe） |
| [`setShadowDom`](./shadow-dom) | `boolean` | `false` | 使用 Shadow DOM |
| [`keepAlive`](./keep-alive) | `boolean` | `false` | 缓存模式 |
| [`showSourceCode`](./show-source-code) | `boolean` | `false` | 显示源码 |
| `data` | `object` | `{}` | 传递给子应用的数据 |
| `initSource` | `string[]` | `[]` | 初始化资源（见下） |

## 基础属性详解

### url（必填）

应用入口 HTML 地址。修改 `<bk-weweb>` 的 `url` 会触发重新加载（它是唯一被 `observedAttributes` 监听的属性）。

### id

应用唯一标识。标签用法下，`appKey = id || url`，即不填 `id` 时回退用 `url` 作为键。建议显式设置 `id`，便于 `mount` / `unmount` 引用。

### mode

`'app'` | `'config'` | `'js'`，对应枚举 `WewebMode`。微应用为默认值 `'app'`，可省略。

### data

传给子应用的数据对象。

- 标签用法：`data` 属性是一个 **JSON 字符串**，框架会 `JSON.parse`，解析失败回退为 `{}`。
- Hooks 用法：直接传对象。

子应用通过 `window.__BK_WEWEB_DATA__` 读取，详见 [全局变量](../api/global-variables)。

```html
<bk-weweb id="app" url="..." data='{"userId":"123","theme":"dark"}'></bk-weweb>
```

### initSource

初始化资源列表（`string | string[]`），用于在子应用入口之外补充需要预先加载的资源。

## 标签用法的属性差异（重要）

`<bk-weweb>` 标签在微应用模式下，对部分布尔属性的解析与 Hooks API **并不完全一致**：

- `scopeCss` 不能通过 `scopeCss` 属性单独关闭，它由是否启用 Shadow DOM 决定（`scopeCss = !setShadowDom`）。
- `scopeJs` 在标签上的取值被取反，**写了反而会关闭沙箱**。详见 [scopeJs](./scope-js) 的"标签用法注意"。

::: tip 建议
需要精确控制隔离行为时，优先使用 **Hooks API**（`loadApp`），其参数语义直观、可预期。
:::
