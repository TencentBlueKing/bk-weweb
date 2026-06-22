# scopeLocation · 路由隔离

- 类型：`boolean`
- 默认值：`false`
- 适用模式：微应用

`scopeLocation` 控制是否为子应用启用**路由（location / history）隔离**。开启后，子应用拥有独立的 `location` 与 `history`，其路由跳转不会改变主应用浏览器地址栏，主子应用路由互不干扰。

## 工作机制

当 `scopeLocation` 为真（或应用是模块型应用）时，`MicroAppModel.start()` 会创建一个隐藏的 iframe：

```ts
if (this.scopeLocation || this.isModuleApp) {
  const iframe = await this.createIframe();
  this.iframe = iframe;
}
```

- iframe 的 `src` 依据子应用 URL 的 `pathname/search/hash` 构造（Chrome 下基于 `about:blank`，其它浏览器基于 `location.origin` 并做停止/重置处理以规避同源安全限制）。
- 子应用沙箱中的 `location` / `history` 被指向该 iframe 的 `contentWindow`，从而获得独立的路由上下文。

iframe 创建过程对 Chrome 与非 Chrome 浏览器做了不同处理（轮询等待 iframe 就绪），细节见 `mode/app.ts` 与 [沙箱实现原理](../principles/sandbox)。

## 用法

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'sub-spa',
  scopeJs: true,
  scopeLocation: true, // 启用路由隔离
});
mount('sub-spa', container);
```

标签用法下 `scopeLocation` 按常规布尔属性解析（写了即开启）：

```html
<bk-weweb id="sub-spa" url="http://localhost:8001/" scopeLocation></bk-weweb>
```

## 何时启用

- 子应用是一个使用 `history` 路由的完整 SPA，且不希望它修改主应用地址栏。
- 主子应用各自维护独立的路由栈，避免前进/后退相互影响。

## 注意事项

- 开启 `scopeLocation` 会引入一个隐藏 iframe，带来少量额外开销与生命周期管理成本。
- 若子应用使用 hash 路由且与主应用无冲突，通常无需开启。
- 依赖 `window.location` 真实地址的子应用逻辑，在隔离后读到的是 iframe 的地址，请知悉。
