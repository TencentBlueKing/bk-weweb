# 数据通信

主应用与子应用之间的通信，在 BK-WeWeb 中有几条清晰的路径。本章把散落在各处的通信方式集中梳理，并给出选型建议。

## 通信方式总览

| 方向 | 方式 | 适用 |
| --- | --- | --- |
| 主 → 子 | `data` 属性 / 参数 → `window.__BK_WEWEB_DATA__` | 初始数据、配置 |
| 子 → 主 | 微模块导出对象上的方法（`getState` 等） | 微模块查询/回调 |
| 主 ↔ 模块 | 持有 `exportInstance`，命令式调用 | 微模块频繁交互 |
| 主 ↔ 子 | 真实 window（`rawWindow`）上的共享对象 / 事件 | 跨应用全局通道 |

## 一、主 → 子：传入数据

### 标签用法

`data` 是一个 **JSON 字符串**，框架会 `JSON.parse`（解析失败回退 `{}`）：

```html
<bk-weweb id="app" url="http://localhost:8001/" data='{"userId":"123","theme":"dark"}'></bk-weweb>
```

### Hooks 用法

直接传对象：

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({ url: 'http://localhost:8001/', id: 'app', data: { userId: '123', theme: 'dark' } });
mount('app', container);
```

### 子应用读取

子应用通过沙箱注入的全局变量读取（沙箱在 `activated` 时把 `data` 写入 `__BK_WEWEB_DATA__`）：

```ts
if (window.__POWERED_BY_BK_WEWEB__) {
  const data = window.__BK_WEWEB_DATA__ ?? {};
  console.log(data.userId, data.theme);
}
```

> 重新 `loadApp` 同一 `id` 时，新的 `data` 会覆盖旧值（见 [loadApp](../hooks/load)）。

## 二、子 → 主 / 主 ↔ 模块：导出方法

微模块导出对象上的方法可被主应用拿到并调用——这是微模块双向通信的主通道。`mount` / `loadInstance` + `mount` 的回调第二参数就是导出对象（`exportInstance`）。

```ts
// 模块侧 widget.js
let state = { count: 0 };
export default {
  render(container, data) {
    state.count = data.initial ?? 0;
    draw(container, state);
  },
  increment() {       // 供主应用调用
    state.count++;
  },
  getState() {        // 供主应用查询
    return state;
  },
};
```

```ts
// 主应用
import { loadInstance, mount } from '@blueking/bk-weweb';

interface Api { increment(): void; getState(): { count: number } }

await loadInstance({ url: '/widget.js', id: 'w', data: { initial: 10 } });
mount<Api>('w', box, (_inst, api) => {
  api?.increment();
  console.log(api?.getState()); // { count: 11 }
});
```

完整约定见 [render 导出规范](../micro-module/render-specification)。

## 三、主 ↔ 子：通过真实 window 共享

当需要一个"全局通道"（如共享事件总线、共享单例、登录态）时，可借助真实 `window`。子应用在沙箱中可通过 `rawWindow` 访问主应用真实全局对象：

```ts
// 主应用：在真实 window 上挂载共享通道
window.__APP_BUS__ = new EventTarget();
window.__APP_CONFIG__ = { env: 'prod' };
```

```ts
// 子应用：经 rawWindow 访问（沙箱开启时 window 是代理）
const realWindow = window.rawWindow || window;
const bus = realWindow.__APP_BUS__;
const cfg = realWindow.__APP_CONFIG__;

bus?.addEventListener('refresh', () => reload());
```

::: warning 注意
- 这种方式会"打穿"隔离，请只共享**明确约定**的少量对象，并做好命名空间，避免污染。
- 未开启 JS 沙箱（`scopeJs: false`）时，子应用的 `window` 本就是真实对象，可直接读写——但也就失去了隔离保护。
- 沙箱写入真实 window 的键仅限白名单，并会在卸载时清理（见 [沙箱实现](../principles/sandbox)）。
:::

## 四、查询任意实例：__getAppOrInstance__

框架在真实 window 上注册了调试/查询入口，可用于跨应用查找实例：

```ts
const cache = window.__getAppOrInstance__();          // 全局 AppCache
const app = window.__getAppOrInstance__('child-app'); // 某个实例
console.log(app?.status, app?.data);
```

## 选型建议

- **初始配置**：用 `data`，最简单清晰。
- **微模块频繁交互**：持有 `exportInstance`，命令式调用其方法（见[组合场景 4](../hooks/compose#场景-4-微模块命令式更新-不重新挂载)）。
- **跨应用全局通道**：约定真实 window 上的命名空间对象 / 事件总线，谨慎使用。
- 避免过度依赖全局通道；能用 `data` + 导出方法解决的，优先用它们。
