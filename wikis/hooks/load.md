# load / loadApp / loadInstance

三个加载入口负责拉取并解析子应用资源、创建实例并写入缓存。它们**只加载、不渲染**，渲染由 [`mount`](./mount) 完成（`loadInstance` 内部会在加载后驱动一次挂载流程，见下）。

## load

统一入口，按 `props.mode` 自动分流：

```ts
function load(props: IBaseModelProps): Promise<BaseModel>;
```

```ts
import { load, WewebMode } from '@blueking/bk-weweb';

// mode === 'js' → 走 loadInstance；否则走 loadApp
await load({ url: 'http://localhost:8002/widget.js', id: 'w', mode: WewebMode.INSTANCE });
```

## loadApp

加载微应用（入口为 HTML）。

```ts
function loadApp(props: IAppModelProps): Promise<MicroAppModel>;
```

行为：

- 以 `props.id` 为键查缓存；命中则复用实例，仅用新的 `data` 覆盖；未命中则 `new MicroAppModel(props)` 并写入缓存。
- 调用实例的 `start()` 拉取并解析入口，`await` 完成后返回实例。

```ts
const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { token: 'xxx' },
});

mount('my-app', document.getElementById('container')!);
```

主要参数（完整见 [类型定义](../api/types) 与 [微应用配置](../micro-app/)）：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**，应用入口 URL |
| `id` | `string` | 随机 | 应用唯一标识，作为缓存键与挂载键 |
| `scopeJs` | `boolean` | `true` | JS 沙箱隔离 |
| `scopeCss` | `boolean` | `true` | CSS 样式隔离 |
| `scopeLocation` | `boolean` | `false` | 路由隔离（启用隐藏 iframe） |
| `keepAlive` | `boolean` | `false` | 缓存模式 |
| `data` | `object` | `{}` | 传递给子应用的数据 |

## loadInstance

加载微模块（入口为 JS）。

```ts
function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel>;
```

行为（与 `loadApp` 略有不同）：

- 未命中缓存：`new MicroInstanceModel(props)` 写入缓存并 `start()`，完成后 resolve。
- 命中但正在挂载 / 未就绪：以 `300ms` 间隔轮询状态，待变为 `MOUNTED` / `ERROR` 后 resolve。
- 命中且就绪：用新 `data` 覆盖后直接 resolve。

```ts
const widget = await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart',
  data: { theme: 'dark' },
});

mount('chart', document.getElementById('chart-box')!, (_inst, exportInstance) => {
  // exportInstance 即微模块导出的对象
});
```

> 微模块的 `scopeJs` 在构造时默认 **`true`**（`props.scopeJs ?? true`）。详见 [微模块 · scopeJs](../micro-module/scope-js)。

## 注意事项

- `loadApp` / `load` 是 `async` 函数，务必 `await` 后再 `mount`，否则资源可能尚未解析完成。
- 重复 `loadApp` 同一 `id` 不会重新拉取资源（除非实例处于 `ERROR`/`UNSET` 需要 reload），只会更新 `data`。
- 要强制重新加载，请先 [`unload(url)`](./unload) 清缓存。
