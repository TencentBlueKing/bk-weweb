# 常见问题 FAQ

汇总接入 BK-WeWeb 时的高频问题与排查思路。

## 加载相关

### 子应用加载失败 / 白屏

按以下顺序排查：

1. **CORS**：子应用资源需允许主应用域跨域访问（响应头 `Access-Control-Allow-Origin`）。框架拉取 HTML/JS 用的是 `fetch`，跨域被拦截会拿不到内容。
2. **URL 正确性**：`url` 必须可直接访问到入口（微应用是 HTML，微模块是 JS）。
3. **控制台错误**：框架在入口内容为空时会 `console.error('load app entry error, place check')`，留意该提示。
4. **资源请求兜底**：内部 `fetchSource` 失败时返回空字符串而非抛错，因此"静默白屏"往往是请求失败。可用[自定义资源获取](../advanced/fetch-source)包裹并在非 2xx 时主动抛错，便于定位。

### `mount` 后没有任何内容

- 是否先 `await loadApp` / `loadInstance` 再 `mount`？未加载就 `mount` 会静默无效。
- 微模块：导出对象是否包含 `render(container, data)`？没有 `render` 不会渲染，见 [render 导出规范](../micro-module/render-specification)。
- `mount` 通过 `nextTask` 异步执行，别假设它同步完成——需要时机回调请用 `mount` 的第三个参数。

## 隔离相关

### 标签上写了 `scopeJs` 反而沙箱失效？

这是微应用**标签用法**的已知行为：源码中 `scopeJs: !getBooleanAttr('scopeJs')` 取了反——

- 不写 `scopeJs` → 沙箱**开启**（默认）
- 写 `scopeJs` / `scopeJs="true"` → 沙箱**关闭**

想精确控制 JS 隔离，请改用 Hooks API：`loadApp({ scopeJs: false })`。详见 [scopeJs](../micro-app/scope-js)。

### 样式冲突 / 子应用样式污染主应用

- 确认 `scopeCss` 生效（微应用默认开启；标签用法下由是否启用 Shadow DOM 决定）。
- 冲突严重时改用 [setShadowDom](../micro-app/shadow-dom) 获得彻底隔离。
- 注意：启用 Shadow DOM 后，部分依赖全局 `document` 查询或不支持 Shadow DOM 的第三方库可能异常，此时回退到 `scopeCss` 作用域改写。

### 子应用路由影响了主应用地址栏

开启 [scopeLocation](../micro-app/scope-location) 做路由隔离（会引入隐藏 iframe，让子应用拥有独立 `location` / `history`）。确认子应用路由模式（hash / history）与隔离策略匹配。

## 通信相关

### 子应用读不到主应用传的 data

- 数据通过 `data` 传入，子应用经 `window.__BK_WEWEB_DATA__` 读取（沙箱在 `activated` 时注入）。
- 标签用法下 `data` 是 **JSON 字符串**，格式错误会被解析为 `{}`。
- 完整方式见 [数据通信](../advanced/communication)。

### 子应用如何访问主应用真实 window

```ts
const realWindow = window.rawWindow || window;
const cfg = realWindow.__MAIN_APP_CONFIG__;
```

未开启沙箱时 `window` 即真实对象。详见 [全局变量](../api/global-variables)。

## 工程相关

### 子应用用 Vite 开发，运行异常 / 全局变量取不到

Vite `dev` 模式以 ESM 运行，需在子应用接入 [Vite 插件](../advanced/vite-plugin)，并保证 `appKey` 与主应用加载该子应用的 `id` 一致。

### KeepAlive 没有保留状态

- 加载时是否传了 `keepAlive: true`？
- 是否用 `activated` / `deactivated` 成对管理？只用 `mount` / `unmount` 不会保留。见 [keepAlive](../micro-app/keep-alive)。

### 子应用更新了，但加载的还是旧版本

资源被缓存。用 `unmount` + [`unload(url)`](../hooks/unload) 清缓存后重新 `loadApp`，见[组合场景 7：强制热更新](../hooks/compose#场景-7-强制热更新-丢弃缓存重载)。

### 同一个微模块想渲染多份，却互相影响

多实例必须用**不同 `id`**，相同 `id` 会命中同一缓存实例。见[组合场景 5](../hooks/compose#场景-5-同一模块的多个实例)。

## 还没解决？

- 用 `window.__getAppOrInstance__(id)` 在控制台查看实例状态（`status` / `data` 等）。
- 阅读[实现原理](../principles/architecture)理解加载-挂载-隔离的内部流程。
