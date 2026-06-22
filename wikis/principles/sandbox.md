# 沙箱实现

当 `scopeJs` 开启时，框架为子应用创建一个 `SandBox`（`context/sandbox.ts`），通过 `Proxy` 把子应用对全局对象的读写收敛到隔离环境，避免污染主应用与其它子应用。

## 核心结构

`SandBox` 构造时主要做四件事：

1. **保存原始引用**：`rawWindow = window`；通过 `createProxyDocument(document, app)` 创建代理 document（`rawDocument`）。
2. **创建 fakeWindow**：一个 `Object.create({})` 的"伪 window"，预置注入属性：

   ```ts
   fakeWindow.__BK_WEWEB_APP_KEY__ = app.appCacheKey;
   fakeWindow.__POWERED_BY_BK_WEWEB__ = true;
   fakeWindow.rawDocument = document;
   fakeWindow.rawWindow = rawWindow;
   ```

   这正是子应用能读到 [`__POWERED_BY_BK_WEWEB__`](../api/global-variables) / `rawWindow` / `rawDocument` 的来源。
3. **重写 window 上的函数**（`rewriteWindowFunction`），并记录还原方法 `resetWindowFunction`。
4. **创建 `proxyWindow = new Proxy(fakeWindow, handler)`**，并以应用名为键挂到真实 window 上：`rawWindow[app.name] = proxyWindow`，供 [Vite 插件](../advanced/vite-plugin) 等通过 `top[appKey]` 取用。

## Proxy 拦截器

`proxyWindow` 的 handler 实现了完整的隔离语义：

### get

`handleProxyGet` 按优先级处理读取：

- `Symbol.unscopables` 与原生函数（`windowNativeFuncMap`）→ 返回真实 window 的值；
- 开发环境特殊键（`DEV_MICRO_APP_WINDOW_KEY_MAP`）→ 返回 fakeWindow 的值；
- window 别名（`WINDOW_ALIAS_LIST`，如 `window` / `self` 等）→ 返回 `proxyWindow` 自身；
- `document` → 注册当前运行应用并返回代理 document（`rawDocument`）；
- `eval` → 注册运行应用并返回原生 `eval`；
- location 相关键（开启 `scopeLocation` 且有 iframe）→ 返回 iframe 的 `contentWindow[key]`；
- `top` / `parent` → 顶层时返回 `proxyWindow`，否则返回真实值；
- `getComputedStyle` → 返回安全代理（非 Element 入参时回退到 `document.body`）；
- 命中 fakeWindow 或注入键列表 → 返回 fakeWindow 的值；
- 兜底 → 从真实 window 取值，并用 `bindFunctionToRawWindow` 绑定正确的 `this`。

### set

`handleProxySet` 仅在沙箱**激活**（`active`）时写入：

- 开启 `scopeLocation` 时对 location 相关键 → 写入 iframe 的 `contentWindow`；
- `location` 赋值 → 写到真实 window（共享主应用地址）；
- 真实 window 上已有、且非注入键 → 按原描述符在 fakeWindow 上定义（保持隔离）；
- 其余 → 写入 fakeWindow，并记入 `sameRawWindowKeySet`；
- 白名单键（`WINDOW_WHITE_LIST`）且真实 window 上没有 → 同步写到真实 window，并记入 `inRawWindowKeySet`（卸载时清理）。

### 其它陷阱

`has` / `ownKeys` / `getOwnPropertyDescriptor` / `defineProperty` / `deleteProperty` 都做了对应处理，保证 `key in window`、`Object.keys(window)` 等行为既能看到真实 window 的键，又能隔离子应用自身新增的键。

## location 隔离与 iframe

开启 [`scopeLocation`](../micro-app/scope-location) 时，`MicroAppModel.start()` 会创建一个隐藏 iframe，沙箱中对 `location` / `history` 等键的读写被代理到该 iframe 的 `contentWindow`，从而实现独立路由。判定逻辑见 `shouldUseIframeLocation`：需同时满足"键在 location 列表中、应用是 `MicroAppModel`、存在 iframe、`scopeLocation` 为真"。

## 激活与停用

```ts
activated(data) {
  this.active = true;
  this.rawDocument = createProxyDocument(document, this.app);
  this.fakeWindow.__BK_WEWEB_DATA__ = data ?? {};  // 主应用数据注入
  // 重写 document / body 事件，记录还原方法
}

deactivated() {
  this.active = false;
  this.resetWindowFunction();          // 还原 window 函数
  // 删除曾写入真实 window 的白名单键
  // 还原 document / body 事件
}
```

- `activated` 时把主应用 `data` 写入 `fakeWindow.__BK_WEWEB_DATA__`，子应用即可通过 `window.__BK_WEWEB_DATA__` 读取。
- `deactivated` 时清理所有对真实环境的副作用（新增全局键、被改写的事件方法），这是隔离能够"可逆"的关键。

## document 与事件隔离

- `createProxyDocument`（`context/document.ts`）代理 document，使子应用的 `document.querySelector` 等在其自身作用域内工作。
- `rewriteDocumentAndBodyEvent`（`context/event.ts`）在激活时改写 document/body 的事件方法，停用时还原，避免事件监听泄漏到主应用。

## 小结

BK-WeWeb 的 JS 沙箱是一种**基于 Proxy 的多实例沙箱**：每个子应用一个 `proxyWindow`，读操作优先走隔离对象、必要时回退真实 window，写操作默认落在隔离对象、仅白名单同步真实 window 并在卸载时清理。配合 iframe 实现 location 隔离，配合 document/event 代理实现 DOM 层隔离。
