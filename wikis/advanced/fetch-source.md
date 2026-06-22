# 自定义资源获取

默认情况下，框架用原生 `window.fetch` 拉取子应用资源。通过自定义 `fetchSource`，你可以接管这一过程——例如为跨域请求注入鉴权头、统一处理错误、走自有网关等。

## 优先级

框架内部的 `fetchSource` 按以下优先级选择实现：

```
应用级 fetchSource  >  全局 fetchSource  >  原生 window.fetch
```

- **全局**：通过 `weWeb.start({ fetchSource })` 设置，对所有子应用生效。
- **应用级**：通过 `loadApp({ fetchSource })` / `loadInstance({ fetchSource })` 为单个应用设置，优先级最高。

> 原生兜底分支在请求失败时返回空字符串（`''`）而非抛错。自定义实现也建议妥善处理异常。

## 全局自定义

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  fetchSource: async (url, options) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.text();
  },
});
```

`fetchSource` 的签名为 `(url: string, options: Record<string, unknown>) => Promise<string>`，需返回资源**文本内容**。

## 应用级自定义

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'secured-app',
  fetchSource: async (url, options) => {
    const res = await fetch(url, { ...options, credentials: 'include' });
    return res.text();
  },
});
mount('secured-app', container);
```

## 适用场景

- 子应用资源需要**鉴权头 / Cookie** 才能访问。
- 资源经由**自有 CDN / 网关**代理，需要改写 URL 或附加签名。
- 需要统一的请求埋点、重试、错误上报。

## 注意事项

- 必须返回字符串内容（HTML / JS / CSS 文本），不要返回 `Response` 对象。
- 自定义实现内部的异常应被捕获处理；返回空字符串会导致子应用资源为空、渲染失败。
