# 预加载

预加载在浏览器**空闲时间**提前拉取并解析子应用资源，使后续 `mount` 几乎瞬时完成，显著提升切换体验。三个预加载方法都从包根导出：

```ts
import { preLoadApp, preLoadInstance, preLoadSource } from '@blueking/bk-weweb';
```

## 工作机制

三者都基于 `requestIdleCallback`，在主线程空闲时执行加载，避免与首屏渲染抢占资源：

```ts
export function preLoadApp(options) {
  requestIdleCallback(() => loadApp({ ...options, isPreLoad: true }));
}
export function preLoadInstance(options) {
  requestIdleCallback(() => loadInstance({ ...options, isPreLoad: true }));
}
export function preLoadSource(sourceList) {
  requestIdleCallback(() => loadGlobalSource(sourceList));
}
```

预加载会把 `isPreLoad` 标记为 `true`。被预加载的应用处于"已加载未挂载"状态：

- `onMount` 在 `isPreLoad` 为真时直接返回，不会自动渲染；
- 之后调用 [`mount`](../hooks/mount) 或 [`activated`](../hooks/activated) 才真正渲染。标签用法下，若元素连接时发现应用已是预加载状态且 URL 匹配，会走 `activated` 直接激活。

## preLoadApp

```ts
preLoadApp({ url: 'http://localhost:8001/', id: 'dashboard', scopeJs: true });
```

## preLoadInstance

```ts
preLoadInstance({ url: 'http://localhost:8002/chart.js', id: 'chart' });
```

## preLoadSource

预取任意资源（样式 / 脚本），参数可为单个 URL 或数组：

```ts
preLoadSource('https://cdn.example.com/echarts.min.js');
preLoadSource(['https://cdn.example.com/a.css', 'https://cdn.example.com/b.js']);
```

## 典型用法

在首屏渲染完成后，延迟预加载下一步大概率会用到的子应用：

```ts
import { preLoadApp, mount } from '@blueking/bk-weweb';

window.addEventListener('load', () => {
  setTimeout(() => {
    preLoadApp({ url: 'http://localhost:8001/', id: 'dashboard', scopeJs: true });
  }, 2000); // 延迟，避免影响首屏
});

// 用户进入时，资源已就绪，挂载几乎瞬时
function openDashboard() {
  mount('dashboard', document.getElementById('container')!);
}
```

## 注意事项

- `requestIdleCallback` 在部分浏览器需 polyfill（框架内部已做兜底处理）。
- 预加载会占用网络与解析资源，应只预取**高概率使用**的子应用，避免浪费带宽。
- 预加载不渲染，不会触发子应用的 `render` / 挂载副作用。
