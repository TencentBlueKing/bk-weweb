# unload

从缓存中**彻底删除**一个应用实例，释放其已解析的资源。

```ts
function unload(url: string): void;
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 应用的缓存键。对微应用即入口 URL；删除时按该键定位实例 |

## 行为

直接调用 `appCache.deleteApp(url)`，把对应实例从全局缓存移除。之后再次 [`loadApp`](./load) / [`loadInstance`](./load) 会创建全新实例并重新拉取、解析资源。

> 注意 `unload` 接收的是缓存键。微应用的 `appCacheKey` 是其 `url`；如果你的 `id` 与 `url` 不同，请确认传入的是正确的缓存键。

## 何时使用

- **强制刷新子应用**：子应用发布了新版本，需要丢弃旧缓存重新加载。
- **释放内存**：长期不再使用的子应用，彻底清理而非仅 [`unmount`](./unmount)。

```ts
import { unload, loadApp, mount } from '@blueking/bk-weweb';

// 丢弃旧缓存
unload('http://localhost:8001/');

// 重新加载最新资源
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
mount('my-app', container);
```

## 三种"卸载"的区别

| 方法 | 清空容器 | 失活沙箱 | 删除缓存 |
| --- | --- | --- | --- |
| [`unmount`](./unmount) | ✅ | ✅ | ❌ |
| [`deactivated`](./deactivated) | 视 `keepAlive` | ✅ | ❌ |
| `unload` | ❌（不操作 DOM） | ❌ | ✅ |

> `unload` 只负责清缓存，并不会帮你卸载正在显示的实例。通常的安全顺序是：先 `unmount`，再 `unload`。
