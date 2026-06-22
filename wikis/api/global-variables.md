# 全局变量

子应用运行在沙箱中时，可通过一组全局变量感知运行环境、读取主应用数据、访问真实的 `window` / `document`。

## 运行环境标志

### `window.__POWERED_BY_BK_WEWEB__`

- 类型：`boolean | undefined`
- 子应用被 BK-WeWeb 加载时为 `true`。可据此判断"是否运行在微前端环境中"，从而做差异化逻辑（如路由 base、资源前缀）。

```ts
if (window.__POWERED_BY_BK_WEWEB__) {
  // 运行在 bk-weweb 中
}
```

### `window.__BK_WEWEB_APP_KEY__`

- 类型：`string | undefined`
- 当前子应用的标识（appKey）。

### `window.__BK_WEWEB_DATA__`

- 类型：`Record<string, unknown> | undefined`
- 主应用通过 `data` 传入的数据。

```ts
const data = window.__BK_WEWEB_DATA__ ?? {};
console.log(data.userId, data.token);
```

## 访问真实 window / document

沙箱会把子应用的 `window` / `document` 代理为隔离对象。当你确实需要操作主应用的真实全局对象时，使用沙箱在代理上注入的原始引用：

```ts
const realWindow = window.rawWindow || window;
const realDocument = window.rawDocument || document;

// 例如读取主应用挂在真实 window 上的配置
const cfg = (window.rawWindow as any)?.__MAIN_APP_CONFIG__;
```

> `rawWindow` / `rawDocument` 由沙箱代理提供（见[沙箱实现](../principles/sandbox)）。未开启 JS 沙箱（`scopeJs: false`）时，`window` 本就是真实对象，可直接使用。

## `window.__getAppOrInstance__(id?)`

框架在真实 `window` 上注册的调试/查询方法：

- 不传 `id` → 返回全局 `AppCache` 实例；
- 传 `id` → 返回对应的应用/模块实例（`BaseModel`）或 `undefined`。

```ts
// 在控制台或主应用中查询
const cache = window.__getAppOrInstance__();         // AppCache
const app = window.__getAppOrInstance__('child-app'); // BaseModel | undefined
console.log(app?.status); // 'MOUNTED' 等
```

## Node 上的标记

框架还会在被托管的 DOM 节点上挂载内部标记（供框架自身使用，一般业务无需关心）：

| 属性 | 说明 |
| --- | --- |
| `node.__BK_WEWEB_APP_KEY__` | 节点所属应用的缓存键 |
| `node.__KEEP_ALIVE__` | KeepAlive 相关标记 |

## TypeScript 提示

上述全局变量已在框架的全局类型声明中扩展到 `Window` / `Node` 接口。在子应用中引用 `@blueking/bk-weweb` 的类型后即可获得类型提示；`rawWindow` / `rawDocument` 为沙箱运行期注入，必要时可自行做类型断言。
