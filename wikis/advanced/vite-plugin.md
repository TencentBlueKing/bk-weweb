# Vite 集成

当子应用使用 Vite 开发时，其源码在 `dev` 模式下以 ESM 直接运行，无法被常规沙箱注入全局变量。BK-WeWeb 提供了一个 Vite 插件，在开发模式下把沙箱全局变量注入到每个模块顶部，使 Vite 子应用也能正确运行在沙箱中。

插件从子路径导出：

```ts
import wewebVitePlugin from '@blueking/bk-weweb/vite/helper';
```

## 使用

在子应用的 `vite.config.ts` 中注册插件，并传入与加载时一致的 `appKey`：

```ts
import { defineConfig } from 'vite';
import wewebVitePlugin from '@blueking/bk-weweb/vite/helper';

export default defineConfig({
  plugins: [
    wewebVitePlugin({
      appKey: 'my-vite-app', // 必填，需与主应用加载该子应用时的 id 一致
    }),
  ],
});
```

## 选项

```ts
interface WewebVitePluginOptions {
  appKey: string;            // 必填，缺省会抛错
  injectWindowKeys?: string[]; // 额外需要从沙箱注入的全局变量名
}
```

- **`appKey`**：必填。插件用它从 `top[appKey]` 上取出对应子应用的沙箱代理对象。缺失时插件直接抛错 `wewebVitePlugin appKey is required`。
- **`injectWindowKeys`**：在内置注入列表之外，追加你的子应用需要从沙箱读取的全局变量名。

## 注入了什么

插件 `apply: 'serve'`、`enforce: 'post'`，仅在 `NODE_ENV === 'development'` 且文件类型为 `js/ts/jsx/tsx/mjs/vue/css` 时生效。它在每个模块顶部注入形如下面的代码，把全局变量指向沙箱代理（取不到时回退到真实 `top`）：

```js
var window = top?.['my-vite-app']?.window || top?.window;
var document = top?.['my-vite-app']?.document || top?.document;
// ... 以及 location / globalThis / self / process
// 以及 Vue 相关与 bk-weweb 注入变量：
// __BK_WEWEB_APP_KEY__ / __BK_WEWEB_DATA__ / __POWERED_BY_BK_WEWEB__ / __VUE_*__ ...
```

内置注入的变量包括：`window`、`globalThis`、`self`、`document`、`location`、`process`，以及 `__POWERED_BY_BK_WEWEB__`、`__BK_WEWEB_APP_KEY__`、`__BK_WEWEB_DATA__` 和一系列 Vue DevTools / 运行时相关标志。

## 注意事项

- 插件**只在开发模式生效**（`apply: 'serve'`）。生产构建产物按常规方式被框架解析执行，无需该插件。
- `appKey` 必须与主应用 [`loadApp`](../hooks/load) / `<bk-weweb>` 的 `id` 严格一致，否则取不到对应沙箱代理。
- 若子应用还依赖其它自定义全局变量，记得通过 `injectWindowKeys` 补充。
