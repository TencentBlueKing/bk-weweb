# scopeCss · 样式隔离（微模块）

- 类型：`boolean`
- 默认值：`true`
- 适用模式：微模块

控制是否为微模块启用 CSS 样式隔离。`MicroInstanceModel` 构造时 `this.scopeCss = props.scopeCss ?? true`，默认开启。

微模块挂载时，若模块带有样式（`source.styles`），会调用 `executeAppStyles` 把样式注入到容器并按作用域改写，使其只在该模块的包裹容器内生效。

## 用法

```ts
import { loadInstance } from '@blueking/bk-weweb';

await loadInstance({ url, id: 'm1', scopeCss: true });  // 默认
await loadInstance({ url, id: 'm2', scopeCss: false });
```

标签用法下，微模块的 `scopeCss` 计算为：

```ts
scopeCss: this.getBooleanAttr('scopeCss') && !this.setShadowDomAttr
```

即：显式写了 `scopeCss` 且未启用 Shadow DOM 时为 `true`；启用 [`setShadowDom`](../micro-app/shadow-dom) 时强制为 `false`（交由 Shadow 边界隔离）。

```html
<bk-weweb id="m" mode="js" url="..." scopeCss></bk-weweb>
```

## 注意事项

- 模块若不含任何样式，则该开关无实际作用。
- 需要彻底隔离时可配合 Shadow DOM。样式改写细节见 [资源解析原理](../principles/entry)。
