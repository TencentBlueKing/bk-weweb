# render 导出规范

微模块（`mode="js"`）的远程 JS 必须导出一个**包含 `render` 方法的对象**。框架执行模块拿到该导出对象（`exportInstance`）后，会调用它的 `render` 完成渲染。

## 最小规范

```ts
// widget.js —— 远程模块入口
export default {
  /**
   * @param container 框架创建的包裹元素（<div id="{name}-wrapper">）
   * @param data      主应用通过 data 传入的数据
   */
  render(container, data) {
    container.innerHTML = `<h3>Hello, ${data.name ?? 'world'}</h3>`;
  },
};
```

框架内部对应逻辑（简化）：

```ts
// 挂载时
const wrapper = document.createElement('div');
wrapper.id = `${name}-wrapper`;
container.appendChild(wrapper);
// 执行脚本后
exportInstance.render(wrapper, data);
```

## 暴露方法供主应用调用

导出对象上的其它方法可以被主应用拿到并调用——`mount` / `loadInstance` + `mount` 的回调第二个参数就是这个 `exportInstance`：

```ts
// widget.js
let root;
export default {
  render(container, data) {
    root = createMyApp(container, data);
  },
  update(newData) {
    root?.setData(newData);
  },
  getState() {
    return root?.getState();
  },
  destroy() {
    root?.unmount();
  },
};
```

```ts
// 主应用
import { loadInstance, mount } from '@blueking/bk-weweb';

interface WidgetApi {
  update(data: unknown): void;
  getState(): unknown;
  destroy(): void;
}

await loadInstance({ url: 'http://localhost:8002/widget.js', id: 'w', data: { name: 'BK' } });

mount<WidgetApi>('w', document.getElementById('box')!, (_instance, api) => {
  api?.update({ name: 'WeWeb' });
  console.log(api?.getState());
});
```

## 资源清理

::: warning 注意
框架在调用 `render` 时**不会使用其返回值**。如果你的模块创建了定时器、事件监听、第三方实例等需要释放的资源，应当：

1. 在导出对象上暴露一个清理方法（如 `destroy`）；
2. 在主应用 [`unmount`](../hooks/unmount) 之前，通过 `mount` 回调拿到的 `api` 主动调用 `api.destroy()`。

不要依赖"`render` 返回一个销毁函数会被自动调用"——当前实现并不会自动执行该返回值。
:::

## 不同框架的 render 实现

::: code-group

```ts [原生]
export default {
  render(container, data) {
    container.textContent = JSON.stringify(data);
  },
};
```

```ts [Vue 3]
import { createApp } from 'vue';
import App from './App.vue';

let app;
export default {
  render(container, data) {
    app = createApp(App, { data });
    app.mount(container);
  },
  destroy() {
    app?.unmount();
  },
};
```

```tsx [React 18]
import { createRoot } from 'react-dom/client';
import App from './App';

let root;
export default {
  render(container, data) {
    root = createRoot(container);
    root.render(<App data={data} />);
  },
  destroy() {
    root?.unmount();
  },
};
```

:::

## 要点

- 导出对象**必须**有 `render(container, data)`，否则挂载后不会渲染任何内容。
- `container` 是框架创建的包裹 `div`，不是你传入的外层容器本身。
- 通过导出更多方法实现主应用 → 模块的调用；通过 `data` 实现主应用 → 模块的数据传递。
- 自行负责资源清理，并暴露给主应用在卸载前调用。
