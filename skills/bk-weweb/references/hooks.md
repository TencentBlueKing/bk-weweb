# 生命周期 Hooks、预加载与组合场景

Hooks API 是一组**正交的原子能力**：加载与渲染分离，共享同一份以 `id`/`url` 为键的全局缓存。可自由组合编排预加载、KeepAlive、容器复用、命令式更新、热更新等场景。

```ts
import {
  load, loadApp, loadInstance,
  mount, unmount, activated, deactivated, unload,
  preLoadApp, preLoadInstance, preLoadSource,
} from '@blueking/bk-weweb';
```

## 速查表

| 方法 | 作用 | 返回值 |
| --- | --- | --- |
| `load(props)` | 按 `mode` 自动分流到 `loadApp`/`loadInstance` | `Promise<BaseModel>` |
| `loadApp(props)` | 加载微应用并启动 | `Promise<MicroAppModel>` |
| `loadInstance(props)` | 加载微模块并启动 | `Promise<MicroInstanceModel>` |
| `mount(appKey, container?, cb?)` | 把已加载应用挂载到容器 | `void` |
| `unmount(appKey)` | 卸载应用（不清缓存） | `void` |
| `activated(appKey, container, cb?)` | 激活（KeepAlive 恢复或常规挂载） | `void` |
| `deactivated(appKey)` | 失活（KeepAlive 保留或等价卸载） | `void` |
| `unload(url)` | 从缓存彻底删除（传缓存键） | `void` |

## 签名

```ts
function load(props: IBaseModelProps): Promise<BaseModel>;
function loadApp(props: IAppModelProps): Promise<MicroAppModel>;
function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel>;
function mount<T>(appKey: string, container?: HTMLElement | ShadowRoot, callback?: (instance: BaseModel, exportInstance?: T) => void): void;
function unmount(appKey: string): void;
function activated<T>(appKey: string, container: HTMLElement | ShadowRoot, callback?: (instance: BaseModel, exportInstance?: T) => void): void;
function deactivated(appKey: string): void;
function unload(url: string): void;
```

## 加载与挂载为何分离

`loadXxx` 只**拉取并解析资源**写入缓存；`mount` 才**渲染到容器**。好处：(1) 可提前预加载，挂载几乎瞬时；(2) 同一应用可多次 `mount`/`unmount` 复用同一份缓存。

行为细节：
- `loadApp`：以 `id` 查缓存，命中则复用实例仅覆盖 `data`，未命中则新建并 `start()`。
- `loadInstance`：未命中则新建并 `start()`；命中但未就绪时以 300ms 轮询直到 `MOUNTED`/`ERROR`；命中且就绪则覆盖 `data` 后 resolve。
- 重复 `loadApp` 同 `id` **不会重新拉取资源**（除非 `ERROR`/`UNSET`），只更新 `data`。要强制重载先 `unload(url)`。

⚠️ **`mount`/`activated` 异步**：内部经 `nextTask` 在微任务后执行，执行前调 `beforeLoad`。需要挂载完成后做事请用回调，别假设同步完成。

## 状态机（AppState）

```
UNSET → LOADING → LOADED → MOUNTING → MOUNTED
MOUNTED ⇄ DEACTIVATED ⇄ ACTIVATED   (keepAlive)
MOUNTED/ACTIVATED → UNMOUNT
LOADING/MOUNTING → ERROR
```

## 三种"卸载"对照

| 方法 | 清空容器 | 失活沙箱 | 删除缓存 | 用途 |
| --- | --- | --- | --- | --- |
| `unmount` | ✅ | ✅ | ❌ | 普通卸载 |
| `deactivated` | 视 `keepAlive` | ✅ | ❌ | KeepAlive 切换 |
| `unload` | ❌ | ❌ | ✅ | 强制释放/重载 |

`unmount` 后若无活跃应用，会 `resetBodyAndHeaderMethods()` 还原被改写的 `document.body`/`head` 方法。`unload` 只清缓存不操作 DOM——安全顺序是先 `unmount` 再 `unload`。`unload` 接收**缓存键**：微应用 `appCacheKey` 即 `url`，若 `id` 与 `url` 不同需确认传对键。

## 预加载

三者基于 `requestIdleCallback`，在主线程空闲时加载，标记 `isPreLoad: true`，处于"已加载未挂载"态（`onMount` 在预加载态直接返回，不自动渲染），之后 `mount`/`activated` 才真正渲染。

```ts
preLoadApp({ url: 'http://localhost:8001/', id: 'dashboard', scopeJs: true });
preLoadInstance({ url: 'http://localhost:8002/chart.js', id: 'chart' });
preLoadSource('https://cdn.example.com/echarts.min.js');           // 单个
preLoadSource(['https://cdn.example.com/a.css', '.../b.js']);      // 数组
```

> 只预取**高概率使用**的子应用，避免浪费带宽。标签用法下，元素连接时若发现同 URL 应用已是预加载态会直接 `activated`。

## KeepAlive 配套

```ts
await loadApp({ url, id: 'list', keepAlive: true }); // 加载时开启
activated('list', containerEl);   // 进入（首次=挂载，再次=恢复）
deactivated('list');              // 离开（keepAlive=true 保留，否则等价 unmount）
```

| `keepAlive` | `deactivated` 效果 | 再次 `activated` |
| --- | --- | --- |
| `true` | 保留 DOM/状态，置 `DEACTIVATED` | 恢复原 DOM 与状态，不重跑脚本 |
| `false` | 等价 `unmount`，清空容器 | 重新挂载并执行脚本 |

## 常见组合场景

**1. 预加载 + 懒挂载**：空闲 `preLoadApp` → 用户进入时 `mount`（瞬时）→ 离开 `unmount`。

**2. Tab/路由 KeepAlive 复用**：所有子应用 `loadApp({ keepAlive: true })`；切换时 `deactivated(旧)` + `activated(新)`，切走保留、切回秒级恢复。

**3. 单容器多子应用切换（不保留）**：
```ts
async function navigate(id, url) {
  if (mounted) unmount(mounted);
  await loadApp({ url, id });   // 已缓存则瞬时返回
  mount(id, container);
  mounted = id;
}
```

**4. 微模块命令式更新**：见 [micro-module.md](micro-module.md)。

**5. 多实例**：同 `url` 不同 `id`。

**6. 动态模式分发**：
```ts
import { load, mount, WewebMode } from '@blueking/bk-weweb';
async function openAny(cfg) { await load(cfg); mount(cfg.id, view); } // mode==='js'→loadInstance
```

**7. 强制热更新（丢缓存重载）**：
```ts
async function hotReload(id, url, container) {
  unmount(id);
  unload(url);              // 传缓存键，微应用即 url
  await loadApp({ url, id });
  mount(id, container);
}
```

**8. 加载态 + 错误兜底 + 重试**：`loadApp` 异步，`try/catch` 包裹；失败时 `unload(url)` 清半成品缓存后重试。注意内置请求兜底失败返回空字符串而非抛错，想强失败感知用自定义 `fetchSource` 在非 2xx 抛错。

**9. 并行预加载 + 编排挂载**：`forEach(preLoadApp)` 后按优先级 `mount`，次要区 `requestIdleCallback` 延后。

## 选择指南

| 诉求 | 推荐组合 |
| --- | --- |
| 切换更快 | 预加载 + 懒 `mount` |
| 切走保留状态 | `keepAlive` + `activated`/`deactivated` |
| 切走即销毁 | `mount`/`unmount` |
| 频繁更新数据 | 微模块导出方法 + 命令式 `update` |
| 多处复用同一模块 | 不同 `id` 多实例 |
| 配置驱动渲染 | `load()` 动态分发 |
| 子应用升级 | `unmount` + `unload` + `loadApp` |
