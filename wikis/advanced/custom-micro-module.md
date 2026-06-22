# 自定义微模块（编程式）

微模块强调"组件级复用 + 主子双向调用"。本章给出编程式管理微模块、与其导出实例交互的实践模式。完整渲染约定见 [render 导出规范](../micro-module/render-specification)。

## 拿到并调用导出实例

`loadInstance` + `mount` 的回调会把模块导出对象（`exportInstance`）交给主应用：

```ts
import { loadInstance, mount, unmount } from '@blueking/bk-weweb';

interface ChartApi {
  update(data: unknown): void;
  destroy(): void;
}

let chartApi: ChartApi | undefined;

await loadInstance({ url: 'http://localhost:8002/chart.js', id: 'chart', data: { theme: 'dark' } });

mount<ChartApi>('chart', document.getElementById('box')!, (_inst, api) => {
  chartApi = api;
  chartApi?.update({ value: 100 });
});

// 后续数据更新：直接调用模块方法，无需重新挂载
function refresh(data: unknown) {
  chartApi?.update(data);
}

// 卸载前主动清理
function close() {
  chartApi?.destroy();
  unmount('chart');
}
```

## 封装为可复用组件

```tsx
// MicroModule.tsx (React)
import { useEffect, useRef } from 'react';
import { loadInstance, mount, unmount } from '@blueking/bk-weweb';

export function MicroModule({ url, id, data }: { url: string; id: string; data?: object }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadInstance({ url, id, data });
      if (alive && ref.current) mount(id, ref.current);
    })();
    return () => {
      alive = false;
      unmount(id);
    };
  }, [url, id]);
  return <div ref={ref} />;
}
```

## 同一模块多实例

微模块 bundle 常需复用，靠 `id` 区分不同实例。给同一个 `url` 配不同 `id`，即可在页面多处渲染互不干扰的实例：

```ts
await loadInstance({ url: '/widget.js', id: 'widget-a', data: { region: 'north' } });
await loadInstance({ url: '/widget.js', id: 'widget-b', data: { region: 'south' } });
mount('widget-a', boxA);
mount('widget-b', boxB);
```

## 要点

- 主 → 模块：通过 `data` 传初始数据，通过导出方法（`update` 等）做后续交互。
- 模块 → 主：在导出对象上暴露 `getState` 等查询方法。
- 资源清理需你自己在导出对象上提供（如 `destroy`），并在 [`unmount`](../hooks/unmount) 前调用——框架不会自动执行 `render` 的返回值。
- 多实例务必使用不同 `id`，否则会命中同一缓存实例。
