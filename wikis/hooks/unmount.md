# unmount

卸载一个已挂载的应用。

```ts
function unmount(appKey: string): void;
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `appKey` | `string` | 应用标识（加载时的 `id`） |

## 行为

- 取出实例，若其状态不是 `UNMOUNT`，调用实例的 `unmount()`：失活沙箱、清空容器内容、释放容器引用。
- 卸载后若**已无任何活跃应用**（`appCache.hasActiveApp` 为 `false`），会调用 `resetBodyAndHeaderMethods()` 还原被框架改写过的 `document.body` / `head` 相关方法，避免影响主应用。
- `unmount` **不会删除缓存**。应用的已解析资源仍保留，下次 `mount` 可直接复用。若要彻底释放，请使用 [`unload(url)`](./unload)。

## 示例

```ts
import { mount, unmount } from '@blueking/bk-weweb';

mount('my-app', container);

// 离开页面时卸载
unmount('my-app');
```

在 Vue 3 中配合组件卸载：

```ts
import { onBeforeUnmount } from 'vue';
import { unmount } from '@blueking/bk-weweb';

onBeforeUnmount(() => unmount('my-app'));
```

## unmount vs deactivated

| 方法 | 是否保留 DOM/状态 | 是否清缓存 | 典型用途 |
| --- | --- | --- | --- |
| `unmount` | 否（清空容器） | 否（保留资源缓存） | 普通卸载 |
| [`deactivated`](./deactivated) | 取决于 `keepAlive`（true 则保留） | 否 | KeepAlive 切换 |
| [`unload`](./unload) | — | 是（删除整个实例缓存） | 强制释放/重载 |
