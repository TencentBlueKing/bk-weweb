# 主应用资源共享

通过启动选项 `collectBaseSource`，主应用可以把自身已加载的资源"共享"给子应用，避免子应用重复加载相同的公共依赖（如同一份 UI 组件库样式）。

## 开启方式

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true,
});
```

## 工作机制

调用 `collectBaseSource()` 后，框架会：

1. **缓存并重写关键 DOM 方法**：保存 `HTMLBodyElement.prototype.appendChild`、`HTMLHeadElement.prototype.appendChild`、`HTMLHeadElement.prototype.insertBefore` 的原始实现，再重写它们，以便拦截后续动态插入到 `head` / `body` 的样式与脚本节点。
2. **收集首屏已有样式**：监听 `window` 的 `load` 事件，在加载完成时扫描 `document.head` 下的 `<style>`，逐个包装成 `Style` 实例存入主应用基础资源缓存（`appCache.setBaseAppStyle`）。

这些被收集的资源存放在 `AppCache` 的 `baseSource` 中。子应用解析资源时，框架会优先从基础资源 / 已有应用缓存中复用（见 `getCacheScript` / `getCacheStyle`），从而减少重复请求。

## 适用场景

- 主应用与多个子应用共用同一套基础库（如蓝鲸 bkui、公共主题样式）。
- 希望减少子应用首次加载体积、加快渲染。

## 注意事项

- `collectBaseSource` 会**改写全局 DOM 原型方法**。框架在没有活跃子应用时会通过 `resetBodyAndHeaderMethods()` 还原这些方法（见 [`unmount`](../hooks/unmount) / [`deactivated`](../hooks/deactivated)）。
- 仅在确有公共资源共享需求时开启；否则保持默认即可。
- 资源收集发生在 `load` 事件后，过早动态注入且在 `load` 前移除的样式可能不被收集。
