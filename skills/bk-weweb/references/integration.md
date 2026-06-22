# 框架集成与子应用改造

BK-WeWeb 基于 Web Components 与平台无关的 Hooks API，可接入任意技术栈。本文给出在各框架中**作为主应用加载子应用**的最小写法，以及子应用侧改造点。

## 通用模式

在框架的"挂载后"钩子里 `await loadApp` → `mount`，在"卸载前"钩子里 `unmount`。容器需在 `mount` 时已存在于 DOM。

## Vue 3

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

const el = ref<HTMLElement>();
const id = 'child-app';

onMounted(async () => {
  await loadApp({ url: 'http://localhost:8001/', id, scopeJs: true, scopeCss: true, data: { from: 'host' } });
  mount(id, el.value!);
});
onBeforeUnmount(() => unmount(id));
</script>

<template>
  <div ref="el" class="micro-container" />
</template>
```

## Vue 2

```vue
<template>
  <div ref="container" class="micro-container" />
</template>

<script>
import { loadApp, mount, unmount } from '@blueking/bk-weweb';
export default {
  async mounted() {
    await loadApp({ url: 'http://localhost:8001/', id: 'child-app', scopeJs: true, scopeCss: true });
    mount('child-app', this.$refs.container);
  },
  beforeDestroy() { unmount('child-app'); },
};
</script>
```

## React

```tsx
import { useEffect, useRef } from 'react';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

export default function MicroApp() {
  const ref = useRef<HTMLDivElement>(null);
  const id = 'child-app';
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadApp({ url: 'http://localhost:8001/', id, scopeJs: true, scopeCss: true });
      if (alive && ref.current) mount(id, ref.current);
    })();
    return () => { alive = false; unmount(id); };
  }, []);
  return <div ref={ref} style={{ height: '100%' }} />;
}
```

> React 严格模式 / 快速重渲染下用 `alive` 标志避免在卸载后才挂载。

## Angular

```ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

@Component({ selector: 'app-micro', template: '<div #container class="micro-container"></div>' })
export class MicroComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  private id = 'child-app';
  async ngOnInit() {
    await loadApp({ url: 'http://localhost:8001/', id: this.id, scopeJs: true, scopeCss: true });
    mount(this.id, this.container.nativeElement);
  }
  ngOnDestroy() { unmount(this.id); }
}
```

## 标签用法（任意框架通用）

不想写生命周期代码时直接用自定义元素，连接/断开自动加载卸载：

```html
<bk-weweb id="child-app" url="http://localhost:8001/"></bk-weweb>
```

> 在 Vue/React 中用标签时注意：框架可能对未知元素告警，需配置允许自定义元素（如 Vue 的 `compilerOptions.isCustomElement`）。布尔属性解析有特殊规则（见 micro-app.md 的标签陷阱），需要精确隔离控制时优先用 Hooks。

## 封装为可复用组件

把 `loadApp`/`mount`/`unmount` 封进组件，对外只暴露 `url`/`id`/`data`：

```vue
<!-- MicroApp.vue -->
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
<template><div ref="el" class="micro-app" /></template>
```

## 子应用侧改造

### 一般子应用：无需改造

微应用通常无需改造即可被加载。如需感知环境或读数据，用全局变量：

```ts
if (window.__POWERED_BY_BK_WEWEB__) {
  const appKey = window.__BK_WEWEB_APP_KEY__;
  const data = window.__BK_WEWEB_DATA__ ?? {};
}
```

### Vite 子应用：必须接插件

Vite `dev` 模式以 ESM 直接运行，无法被常规沙箱注入全局变量。需在**子应用**接入 Vite 插件：

```ts
// 子应用 vite.config.ts
import { defineConfig } from 'vite';
import wewebVitePlugin from '@blueking/bk-weweb/vite/helper';

export default defineConfig({
  plugins: [
    wewebVitePlugin({
      appKey: 'child-app',          // 必填，须与主应用加载该子应用的 id 一致
      // injectWindowKeys: ['MY_GLOBAL'], // 额外需从沙箱注入的全局变量名
    }),
  ],
});
```

- `appKey` 必填且必须与主应用 `loadApp`/`<bk-weweb>` 的 `id` **严格一致**，否则取不到沙箱代理；缺失会抛错 `wewebVitePlugin appKey is required`。
- 插件 `apply:'serve'`，**只在 dev 生效**；生产构建产物按常规被框架解析，无需该插件。
- 内置注入：`window`/`globalThis`/`self`/`document`/`location`/`process` 及 `__POWERED_BY_BK_WEWEB__`/`__BK_WEWEB_APP_KEY__`/`__BK_WEWEB_DATA__` 与 Vue 相关标志。其它自定义全局变量用 `injectWindowKeys` 补充。

## 通用注意事项

- 容器需在 `mount` 时已存在于 DOM。
- 组件卸载记得 `unmount`；需要保留状态改用 `keepAlive` + `activated`/`deactivated`。
- 子应用资源需允许跨域（CORS），否则资源拉取失败导致白屏。
- 子应用感知环境用[全局变量](api.md)。
