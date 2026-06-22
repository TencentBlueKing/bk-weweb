# 自定义微应用（编程式）

除了直接写 `<bk-weweb>` 标签，你还可以完全用 Hooks API 编程式地管理微应用，从而获得对加载、挂载、错误处理、生命周期的精细控制。本章给出几种常见的"自定义"封装模式。

## 自定义元素标签名

如果默认的 `bk-weweb` 标签名与现有元素冲突，可在启动时改名：

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({ webComponentTag: 'micro-frame' });
```

之后即可使用 `<micro-frame url="..."></micro-frame>`。`start` 内部调用 `setWebComponentTag()` 完成注册（不会重复注册同名元素）。

## 封装为框架组件

把 `loadApp` / `mount` / `unmount` 封装进一个组件，对外只暴露 `url` / `id` / `data`：

```vue
<!-- MicroApp.vue (Vue 3) -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

const props = defineProps<{ url: string; id: string; data?: Record<string, unknown> }>();
const el = ref<HTMLElement>();

onMounted(async () => {
  await loadApp({ url: props.url, id: props.id, data: props.data, scopeJs: true, scopeCss: true });
  mount(props.id, el.value!);
});
onBeforeUnmount(() => unmount(props.id));
</script>

<template>
  <div ref="el" class="micro-app" />
</template>
```

## 带加载态与错误处理

`loadApp` 是异步的，可据此实现加载中 / 失败 UI：

```ts
import { loadApp, mount } from '@blueking/bk-weweb';

async function openApp(container: HTMLElement) {
  try {
    showSpinner(container);
    await loadApp({ url: 'http://localhost:8001/', id: 'app' });
    mount('app', container, () => hideSpinner(container));
  } catch (e) {
    showError(container, e);
  }
}
```

> 注意：当资源请求失败时，框架内部的 `fetchSource` 兜底会返回空字符串而非抛错；若需更强的失败感知，可用[自定义资源获取](./fetch-source)包裹请求并自行抛错。

## 配合 KeepAlive 的路由复用

在路由切换场景下用 [`activated`](../hooks/activated) / [`deactivated`](../hooks/deactivated) 复用实例：

```ts
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 路由初始化时（一次）
await loadApp({ url, id: 'page-a', keepAlive: true });

// 进入路由
activated('page-a', container);
// 离开路由
deactivated('page-a');
```

## 要点

- 编程式加载与标签用法共享同一份缓存（以 `id`/`url` 为键），二者可混用。
- `loadApp` 与 `mount` 分离，便于配合[预加载](./preload)。
- 始终在合适时机 [`unmount`](../hooks/unmount) / [`unload`](../hooks/unload) 释放资源。
