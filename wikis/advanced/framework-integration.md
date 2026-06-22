# 框架集成

BK-WeWeb 基于 Web Components 与平台无关的 Hooks API，可接入任意技术栈。仓库 `examples/` 下提供了一个 webpack 主应用与 Vue 2 / Vue 3 / React / Angular / Vite / 微模块等子应用示例。本章给出在各框架中**作为主应用加载子应用**的最小写法。

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
  beforeDestroy() {
    unmount('child-app');
  },
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
    return () => {
      alive = false;
      unmount(id);
    };
  }, []);

  return <div ref={ref} style={{ height: '100%' }} />;
}
```

## Angular

```ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

@Component({
  selector: 'app-micro',
  template: '<div #container class="micro-container"></div>',
})
export class MicroComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  private id = 'child-app';

  async ngOnInit() {
    await loadApp({ url: 'http://localhost:8001/', id: this.id, scopeJs: true, scopeCss: true });
    mount(this.id, this.container.nativeElement);
  }
  ngOnDestroy() {
    unmount(this.id);
  }
}
```

## Vite 子应用

子应用若用 Vite 开发，需要在子应用侧接入 [Vite 插件](./vite-plugin) 以正确注入沙箱全局变量：

```ts
// 子应用 vite.config.ts
import wewebVitePlugin from '@blueking/bk-weweb/vite/helper';

export default {
  plugins: [wewebVitePlugin({ appKey: 'child-app' })],
};
```

主应用侧加载方式与上述一致（`loadApp` / `<bk-weweb>`）。

## 标签用法（任意框架通用）

如果不想写生命周期代码，直接用自定义元素即可，连接/断开自动加载与卸载：

```html
<bk-weweb id="child-app" url="http://localhost:8001/"></bk-weweb>
```

## 通用注意事项

- 容器需在 `mount` 时已存在于 DOM 中。
- 组件卸载时记得 [`unmount`](../hooks/unmount)；需要保留状态时改用 [`keepAlive`](../micro-app/keep-alive) + `activated`/`deactivated`。
- 子应用需允许跨域（CORS），否则资源拉取失败。
- 子应用如需感知运行环境，使用[全局变量](../api/global-variables)。
