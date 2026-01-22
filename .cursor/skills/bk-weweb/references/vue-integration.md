# Vue 3 集成指南

## 组件封装

```vue
<template>
  <div
    ref="containerRef"
    class="micro-app-container"
  ></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { loadApp, mount, unmount, activated, deactivated } from '@blueking/bk-weweb';

  interface Props {
    appId: string;
    url: string;
    data?: Record<string, unknown>;
    keepAlive?: boolean;
    scopeJs?: boolean;
    scopeCss?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    keepAlive: false,
    scopeJs: true,
    scopeCss: true,
  });

  const containerRef = ref<HTMLElement | null>(null);
  const isLoaded = ref(false);

  onMounted(async () => {
    await loadApp({
      url: props.url,
      id: props.appId,
      scopeJs: props.scopeJs,
      scopeCss: props.scopeCss,
      keepAlive: props.keepAlive,
      data: props.data,
    });

    isLoaded.value = true;

    if (props.keepAlive) {
      activated(props.appId, containerRef.value!);
    } else {
      mount(props.appId, containerRef.value!);
    }
  });

  onBeforeUnmount(() => {
    if (props.keepAlive) {
      deactivated(props.appId);
    } else {
      unmount(props.appId);
    }
  });

  // 监听 data 变化
  watch(
    () => props.data,
    newData => {
      if (isLoaded.value && newData) {
        // 通过重新加载更新数据
        loadApp({
          url: props.url,
          id: props.appId,
          data: newData,
        });
      }
    },
    { deep: true },
  );
</script>
```

## Composable 封装

```typescript
// useMicroApp.ts
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

export function useMicroApp(options: {
  url: string;
  id: string;
  scopeJs?: boolean;
  scopeCss?: boolean;
  data?: Record<string, unknown>;
}) {
  const containerRef = ref<HTMLElement | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  onMounted(async () => {
    try {
      await loadApp({
        url: options.url,
        id: options.id,
        scopeJs: options.scopeJs ?? true,
        scopeCss: options.scopeCss ?? true,
        data: options.data,
      });

      if (containerRef.value) {
        mount(options.id, containerRef.value);
      }
      loading.value = false;
    } catch (e) {
      error.value = e as Error;
      loading.value = false;
    }
  });

  onBeforeUnmount(() => {
    unmount(options.id);
  });

  return {
    containerRef,
    loading,
    error,
  };
}
```

## 使用示例

```vue
<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div
    ref="containerRef"
    v-else
  ></div>
</template>

<script setup>
  import { useMicroApp } from './useMicroApp';

  const { containerRef, loading, error } = useMicroApp({
    url: 'http://localhost:8001/',
    id: 'dashboard',
    data: { userId: '123' },
  });
</script>
```
