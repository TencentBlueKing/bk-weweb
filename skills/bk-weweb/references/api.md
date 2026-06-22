# API：start、全局变量、类型、通信与 FAQ

## WeWeb 类与 start

包的默认导出是 `WeWeb` 单例。导入时自动把 `bk-weweb` 注册到 `window.customElements`。`start()` 可选——不需要全局配置时只 `import '@blueking/bk-weweb'` 即可。

```ts
class WeWeb {
  fetchSource?: FetchSourceType;
  webComponentTag: string;        // 默认 'bk-weweb'
  setWebComponentTag(): void;
  start(option?: IStartOption): void;
}

interface IStartOption {
  collectBaseSource?: boolean;    // 收集主应用资源供子应用共享
  fetchSource?: FetchSourceType;  // 全局自定义资源获取
  webComponentTag?: string;       // 自定义元素标签名
}
type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
```

```ts
import weWeb from '@blueking/bk-weweb';
weWeb.start({
  collectBaseSource: true,
  webComponentTag: 'micro-frame',
  fetchSource: async (url, options) => {
    const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}` } });
    return res.text();
  },
});
```

### collectBaseSource · 主应用资源共享

`true` 时框架重写 `head`/`body` 的 `appendChild`/`insertBefore` 以拦截动态插入的样式/脚本，并在 `window load` 后收集 `document.head` 下的 `<style>` 存入基础资源缓存，子应用解析时优先复用，减少重复请求。适合主子共用同一套基础库（如 bkui、公共主题）。会改写全局 DOM 原型方法，无活跃子应用时由 `resetBodyAndHeaderMethods()` 还原。

### fetchSource · 自定义资源获取

优先级：**应用级 `loadApp({ fetchSource })` > 全局 `start({ fetchSource })` > 原生 `fetch`**。签名 `(url, options) => Promise<string>`，必须返回资源**文本内容**（HTML/JS/CSS），不要返回 `Response`。用于注入鉴权头/Cookie、走自有网关、统一埋点重试。

```ts
// 应用级
await loadApp({
  url, id: 'secured-app',
  fetchSource: async (url, options) => (await fetch(url, { ...options, credentials: 'include' })).text(),
});
```

> 原生兜底分支请求失败时返回空字符串而非抛错（易"静默白屏"）。想强失败感知，在自定义实现里非 2xx 主动抛错。

## 全局变量（子应用侧）

| 变量 | 类型 | 说明 |
| --- | --- | --- |
| `window.__POWERED_BY_BK_WEWEB__` | `boolean?` | 被 bk-weweb 加载时为 `true`，用于差异化逻辑 |
| `window.__BK_WEWEB_APP_KEY__` | `string?` | 当前子应用标识（appKey） |
| `window.__BK_WEWEB_DATA__` | `object?` | 主应用通过 `data` 传入的数据（沙箱在 `activated` 时注入） |
| `window.rawWindow` | `Window` | 沙箱代理上的真实 window 引用 |
| `window.rawDocument` | `Document` | 真实 document 引用 |
| `window.__getAppOrInstance__(id?)` | `function` | 不传 → 全局 `AppCache`；传 `id` → 实例（`BaseModel`）或 `undefined`，调试查询用 |

```ts
const realWindow = window.rawWindow || window;  // 沙箱开启时 window 是代理
const app = window.__getAppOrInstance__('child-app');
console.log(app?.status, app?.data);
```

> 节点上还有内部标记 `node.__BK_WEWEB_APP_KEY__`、`node.__KEEP_ALIVE__`（框架自用，业务一般不关心）。

## 主子应用通信

| 方向 | 方式 | 适用 |
| --- | --- | --- |
| 主 → 子 | `data` → `window.__BK_WEWEB_DATA__` | 初始数据、配置 |
| 子 → 主 / 主 ↔ 模块 | 微模块导出对象的方法（`getState` 等） | 微模块查询/回调 |
| 主 ↔ 子全局通道 | 真实 `window`（`rawWindow`）上的共享对象/事件 | 跨应用通道，谨慎 |

主 → 子：标签 `data` 是 JSON 字符串（解析失败回退 `{}`），Hooks 直接传对象；重新 `loadApp` 同 `id` 时新 `data` 覆盖。

```ts
// 全局通道（谨慎使用，会打穿隔离）
window.__APP_BUS__ = new EventTarget();                  // 主应用挂在真实 window
const bus = (window.rawWindow || window).__APP_BUS__;    // 子应用读取
```

> 沙箱写入真实 window 的键仅限白名单并在卸载时清理。优先用 `data` + 导出方法，避免过度依赖全局通道。

## 核心类型

```ts
enum WewebMode { APP = 'app', CONFIG = 'config', INSTANCE = 'js' }

interface IBaseModelProps {
  mode?: WewebMode;
  url: string;                 // 必填
  id?: string | null;
  isPreLoad?: boolean;
  fetchSource?: (url: string, options: Record<string, unknown>) => Promise<string>;
}

interface IAppModelProps extends IBaseModelProps {   // 微应用
  data?: Record<string, unknown>;
  keepAlive?: boolean;       // 默认 false
  scopeCss?: boolean;        // 默认 true
  scopeJs?: boolean;         // 默认 true
  scopeLocation?: boolean;   // 默认 false
  setShadowDom?: boolean;    // 默认 false
  showSourceCode?: boolean;  // 默认 false
  container?: HTMLElement | ShadowRoot | null;
  initSource?: string | string[];
}

interface IJsModelProps extends IBaseModelProps {    // 微模块
  data?: Record<string, unknown>;
  keepAlive?: boolean;       // 默认 false
  scopeCss?: boolean;        // 默认 true
  scopeJs?: boolean;         // 默认 true
  showSourceCode?: boolean;  // 默认 true（与微应用相反）
  container?: HTMLElement | ShadowRoot | null;
  initSource?: string | string[];
}

type ContainerType = HTMLElement | ShadowRoot;
type CallbackFunction<T = unknown> = (instance: BaseModel, exportInstance?: T) => void;
```

`BaseModel`（实例对外接口节选）：`appCacheKey`/`name`/`url`/`data`/`status`/`scopeJs` 等属性，`start()`/`mount()`/`unmount()`/`activated()`/`deactivated()` 等方法。

`<bk-weweb>` 支持属性：`data`、`id`、`keepAlive`、`mode`、`scopeCss`、`scopeJs`、`scopeLocation`、`setShadowDom`、`setShodowDom`（已废弃）、`showSourceCode`、`url`。

## FAQ / 排查

**子应用加载失败 / 白屏**：① CORS（资源需允许主应用域跨域）；② `url` 是否可直接访问到入口；③ 看控制台 `load app entry error, place check`；④ 请求失败兜底返回空字符串，用自定义 `fetchSource` 在非 2xx 抛错便于定位。

**`mount` 后无内容**：是否先 `await loadApp`/`loadInstance`？微模块是否导出 `render(container, data)`？`mount` 异步，时机用回调。

**标签写了 `scopeJs` 沙箱反而失效**：微应用标签 `scopeJs` 取反，用 Hooks `loadApp({ scopeJs: false })`。

**样式冲突**：确认 `scopeCss` 生效（标签下由 `setShadowDom` 决定）；严重时用 `setShadowDom`，但注意部分库在 Shadow DOM 下异常则回退作用域改写。

**子应用路由影响主应用地址栏**：开 `scopeLocation`，确认路由模式匹配。

**子应用读不到 data**：经 `window.__BK_WEWEB_DATA__` 读；标签 `data` 是 JSON 字符串，格式错会被当 `{}`。

**Vite 子应用运行异常 / 全局变量取不到**：接 `@blueking/bk-weweb/vite/helper`，`appKey` 与主应用加载 `id` 一致。

**KeepAlive 没保留状态**：加载传 `keepAlive: true` 了吗？是否用 `activated`/`deactivated` 成对管理（只用 `mount`/`unmount` 不保留）？

**子应用更新了但还是旧版本**：资源被缓存。`unmount` + `unload(url)` 后重新 `loadApp`。

**同一模块多份互相影响**：多实例必须用不同 `id`。

> 控制台用 `window.__getAppOrInstance__(id)` 查实例 `status`/`data`。
