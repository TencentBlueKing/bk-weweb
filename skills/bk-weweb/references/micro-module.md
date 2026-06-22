# 微模块（mode=js）与 render 规范

微模块入口是一个**远程 JS 模块**。框架执行该模块后，调用其导出对象的 `render(container, data)` 把内容渲染进容器。适合远程组件、图表、插件等"组件级"复用与主子双向调用。

## 属性速查（Hooks `loadInstance` 传入时的默认值）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**，JS 模块地址 |
| `id` | `string` | 随机串 | **建议必填**，缓存键（多实例靠它区分） |
| `mode` | `'js'` | — | **必填**，固定 `'js'` |
| `scopeJs` | `boolean` | `true` | JS 沙箱隔离 |
| `scopeCss` | `boolean` | `true` | CSS 样式隔离 |
| `keepAlive` | `boolean` | `false` | 缓存模式 |
| `showSourceCode` | `boolean` | **`true`** | 显示源码（与微应用相反，默认开启） |
| `data` | `object` | `{}` | 透传给 `render` 的数据 |
| `initSource` | `string \| string[]` | `[]` | 初始化资源 |

> 微模块标签的 `scopeJs` **不取反**（`scopeJs: getBooleanAttr('scopeJs')`，构造函数 `?? true`）：不写默认开启，`scopeJs="false"` 关闭。这点与微应用标签不同。

## 渲染流程

`mount` 微模块时内部顺序：
1. 清空容器，创建包裹元素 `<div id="{name}-wrapper">`；
2. 注入模块样式（若有）；
3. 激活沙箱；
4. 执行模块脚本，拿到导出对象 `exportInstance`；
5. 调用 `exportInstance.render(wrapper, data)`；
6. 触发 `mount` 回调，第二个参数即 `exportInstance`。

> `container` 传入 `render` 的是框架创建的**包裹 div**，不是你传给 `mount` 的外层容器本身。

## render 导出规范

远程 JS **必须导出含 `render` 方法的对象**：

```ts
// widget.js
export default {
  render(container, data) {
    container.innerHTML = `<h3>Hello, ${data.name ?? 'world'}</h3>`;
  },
};
```

### 暴露方法供主应用调用（双向通信主通道）

导出对象上的其它方法可被主应用拿到调用——`mount` 回调第二参数就是 `exportInstance`：

```ts
// widget.js
let root;
export default {
  render(container, data) { root = createMyApp(container, data); },
  update(newData) { root?.setData(newData); }, // 供主应用调用
  getState() { return root?.getState(); },     // 供主应用查询
  destroy() { root?.unmount(); },              // 清理
};
```

```ts
// 主应用
import { loadInstance, mount } from '@blueking/bk-weweb';
interface WidgetApi { update(d: unknown): void; getState(): unknown; destroy(): void }

await loadInstance({ url: '/widget.js', id: 'w', data: { name: 'BK' } });
mount<WidgetApi>('w', document.getElementById('box')!, (_inst, api) => {
  api?.update({ name: 'WeWeb' });
  console.log(api?.getState());
});
```

### ⚠️ 资源清理

框架在调用 `render` 时**不会使用其返回值**。若模块创建了定时器、事件监听、第三方实例等需释放的资源：
1. 在导出对象上暴露清理方法（如 `destroy`）；
2. 在主应用 `unmount` **之前**，通过 `mount` 回调拿到的 `api` 主动调 `api.destroy()`。

不要依赖"`render` 返回一个销毁函数会被自动调用"——当前实现不会执行该返回值。

### 不同框架的 render 实现

```ts
// Vue 3
import { createApp } from 'vue';
import App from './App.vue';
let app;
export default {
  render(container, data) { app = createApp(App, { data }); app.mount(container); },
  destroy() { app?.unmount(); },
};
```

```tsx
// React 18
import { createRoot } from 'react-dom/client';
import App from './App';
let root;
export default {
  render(container, data) { root = createRoot(container); root.render(<App data={data} />); },
  destroy() { root?.unmount(); },
};
```

## 命令式更新（不重新挂载）

挂载后持有导出实例，后续只调方法更新数据，避免重复挂载开销：

```ts
let api;
await loadInstance({ url: '/chart.js', id: 'chart', data: { theme: 'dark' } });
mount('chart', box, (_inst, exportInstance) => { api = exportInstance; });

function refresh(data) { api?.update(data); }   // 数据变化直接调
function close() { api?.destroy(); unmount('chart'); } // 卸载前自清理
```

## 同一模块多实例

同一份 JS bundle 在页面多处渲染、互不干扰，靠**不同 `id`** 区分缓存实例：

```ts
await loadInstance({ url: '/widget.js', id: 'widget-a', data: { region: 'north' } });
await loadInstance({ url: '/widget.js', id: 'widget-b', data: { region: 'south' } });
mount('widget-a', boxA);
mount('widget-b', boxB);
```

⚠️ 相同 `id` 会命中同一缓存实例，得不到两个独立实例。多实例务必用不同 `id`。

## 要点

- 导出对象**必须**有 `render(container, data)`，否则挂载后无内容。
- 主 → 模块：`data` 传初始数据 + 导出方法做后续交互；模块 → 主：导出查询方法（`getState` 等）。
- 自行负责资源清理并暴露给主应用在卸载前调用。
