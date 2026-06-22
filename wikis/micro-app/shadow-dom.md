# setShadowDom · Shadow DOM

- 类型：`boolean`
- 默认值：`false`
- 适用模式：微应用 / 微模块

`setShadowDom` 控制是否用 [Shadow DOM](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_shadow_DOM) 承载子应用。启用后，子应用被挂载进一个 `mode: 'open'` 的 ShadowRoot，获得浏览器原生的样式与结构隔离边界。

## 工作机制

`<bk-weweb>` 在连接到 DOM（`connectedCallback`）或属性变化时，若检测到 `setShadowDom`，会调用 `attachShadow` 创建 ShadowRoot，并把它作为挂载容器：

```ts
if (this.setShadowDomAttr && !this.shadowRoot) {
  this.attachShadow({ delegatesFocus: false, mode: 'open' });
}
// ...容器为 this.shadowRoot ?? this
```

同时，启用 Shadow DOM 时框架不再做 CSS 作用域改写（`scopeCss = !setShadowDom`），因为 Shadow 边界已天然隔离样式。

针对在 ShadowRoot 中渲染图表类库（如 ECharts）的场景，框架还为 ShadowRoot 注入了 `getBoundingClientRect` 的兼容处理（代理到宿主元素），见 `initShadowRootContainer`。

## 兼容旧拼写 setShodowDom

历史版本存在拼写错误的属性 `setShodowDom`。框架做了向后兼容：

```ts
get setShadowDomAttr() {
  return this.getBooleanAttr('setShadowDom') ?? this.getBooleanAttr('setShodowDom');
}
```

::: warning 已废弃
`setShodowDom`（少了一个 a）为历史遗留拼写，仅作兼容保留。新代码请统一使用 **`setShadowDom`**。
:::

## 用法

```html
<!-- 标签用法 -->
<bk-weweb id="app" url="http://localhost:8001/" setShadowDom></bk-weweb>
```

## 何时使用

- 需要**最彻底**的样式隔离，杜绝任何样式穿透。
- 子应用样式较复杂、与主应用冲突风险高。

## 注意事项

- 部分依赖全局 `document` 选择器、或不支持 Shadow DOM 的第三方库，在 Shadow DOM 下可能异常。此时改用 [scopeCss](./scope-css) 的作用域改写更稳妥。
- 启用 Shadow DOM 后，主应用通过普通 `document.querySelector` 无法直接选中子应用内部节点（需经 `shadowRoot`）。
