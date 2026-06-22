# 生命周期 Hooks 概览

除了 `<bk-weweb>` 标签的自动生命周期外，BK-WeWeb 导出了一组 Hooks API，让你以编程方式精确控制加载、挂载、激活、卸载等时机。

这些方法是一组**正交的原子能力**：加载与渲染分离、共享同一份以 `id`/`url` 为键的全局缓存。正因如此，你可以**自由组合**它们来编排预加载、KeepAlive、容器复用、命令式更新、热更新等各种微前端场景，而不必受标签固定生命周期的约束。这是 Hooks 相比 `<bk-weweb>` 标签的核心价值。

::: tip 想直接看怎么"组合"？
跳到 [组合与自定义场景](./compose)，那里有 9 个结合源码的可运行示例（预加载懒挂载、KeepAlive 切换、命令式更新、热更新……）。
:::

所有方法都从包根导出：

```ts
import {
  load,
  loadApp,
  loadInstance,
  mount,
  unmount,
  activated,
  deactivated,
  unload,
} from '@blueking/bk-weweb';
```

## 速查表

| 方法 | 作用 | 返回值 |
| --- | --- | --- |
| [`load(props)`](./load) | 按 `mode` 自动分流到 `loadApp` / `loadInstance` | `Promise<BaseModel>` |
| [`loadApp(props)`](./load) | 加载微应用并启动 | `Promise<MicroAppModel>` |
| [`loadInstance(props)`](./load) | 加载微模块并启动 | `Promise<MicroInstanceModel>` |
| [`mount(appKey, container?, cb?)`](./mount) | 把已加载的应用挂载到容器 | `void` |
| [`unmount(appKey)`](./unmount) | 卸载应用 | `void` |
| [`activated(appKey, container, cb?)`](./activated) | 激活（KeepAlive 恢复或常规挂载） | `void` |
| [`deactivated(appKey)`](./deactivated) | 失活（KeepAlive 保留或等价卸载） | `void` |
| [`unload(url)`](./unload) | 从缓存中彻底删除应用 | `void` |

## 加载与挂载为何分离

`loadXxx` 只负责**拉取并解析资源**（写入缓存），`mount` 才负责**渲染到容器**。两者分离带来两个好处：

1. 可以提前 [预加载](../advanced/preload)，把耗时的网络与解析放到空闲时间，挂载时几乎瞬时完成。
2. 同一个应用可以被多次 `mount` / `unmount`，复用同一份已解析的资源缓存（缓存以 `id`/`url` 为键）。

## 典型时序

```ts
// 应用启动时：空闲预加载
preLoadApp({ url, id: 'dashboard', scopeJs: true });

// 进入路由时：挂载
mount('dashboard', containerEl);

// 离开路由时：卸载（或失活以保留状态）
unmount('dashboard');
```

> `mount`、`activated` 都通过内部的 `nextTask` 在微任务后执行，并在执行前调用 `beforeLoad` 做环境准备，因此调用后不会同步完成挂载。需要在挂载完成后做事情，请使用回调参数。
