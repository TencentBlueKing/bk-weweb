# Hooks API 概述

## 什么是 Hooks

BK-WeWeb Hooks 是一套用于编程式控制微应用和微模块生命周期的函数 API。相比于直接使用 `<bk-weweb>` Web Component 标签，使用 Hooks 可以：

- **保持数据引用**：直接传递对象，无需 JSON 序列化
- **更好的兼容性**：适配不同浏览器环境
- **精细的控制**：完全控制加载、挂载、卸载时机
- **获取导出实例**：获取子应用/模块导出的方法和状态
- **自定义容器**：灵活选择渲染容器

## Hooks 一览

### 加载类

| Hook                               | 说明         | 返回值                        |
| ---------------------------------- | ------------ | ----------------------------- |
| [load](./load.md)                  | 统一加载入口 | `Promise<BaseModel>`          |
| [loadApp](./load-app.md)           | 加载微应用   | `Promise<MicroAppModel>`      |
| [loadInstance](./load-instance.md) | 加载微模块   | `Promise<MicroInstanceModel>` |

### 生命周期类

| Hook                            | 说明          | 返回值 |
| ------------------------------- | ------------- | ------ |
| [mount](./mount.md)             | 挂载到容器    | `void` |
| [unmount](./unmount.md)         | 卸载应用/模块 | `void` |
| [activated](./activated.md)     | 激活应用/模块 | `void` |
| [deactivated](./deactivated.md) | 停用应用/模块 | `void` |
| [unload](./unload.md)           | 删除缓存资源  | `void` |

### 预加载类

| Hook                                                         | 说明         | 返回值 |
| ------------------------------------------------------------ | ------------ | ------ |
| [preLoadApp](../../../advanced/preload.md#预加载微应用)      | 预加载微应用 | `void` |
| [preLoadInstance](../../../advanced/preload.md#预加载微模块) | 预加载微模块 | `void` |
| [preLoadSource](../../../advanced/preload.md#预加载资源文件) | 预加载资源   | `void` |

## 基本用法

### 微应用完整示例

```typescript
import { loadApp, mount, unmount, activated, deactivated } from '@blueking/bk-weweb';

// 1. 加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});

// 2. 挂载到容器
mount('my-app', document.getElementById('container'));

// 3. 卸载应用
unmount('my-app');

// 或者使用 activated/deactivated（keepAlive 模式）
activated('my-app', document.getElementById('container'));
deactivated('my-app');
```

### 微模块完整示例

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 1. 加载模块
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  scopeJs: true,
  data: { type: 'chart' },
});

// 2. 激活模块
activated('my-module', document.getElementById('container'), (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);
});

// 3. 停用模块
deactivated('my-module');
```

## 生命周期流程

### 微应用生命周期

```
                    loadApp()
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADING                   │
    │         (加载 HTML/CSS/JS)             │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADED                    │
    │           (资源加载完成)                │
    └───────────────────────────────────────┘
                        │
                        ▼ mount()
    ┌───────────────────────────────────────┐
    │             MOUNTING                   │
    │            (正在挂载)                  │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              MOUNTED                   │
    │             (已挂载)                   │
    └───────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼ unmount()                 ▼ deactivated()
    ┌───────────┐              ┌───────────────┐
    │  UNMOUNT  │              │  DEACTIVATED  │
    │  (已卸载)  │              │   (已停用)    │
    └───────────┘              └───────────────┘
                                      │
                                      ▼ activated()
                               ┌───────────────┐
                               │   ACTIVATED   │
                               │   (已激活)    │
                               └───────────────┘
```

### 微模块生命周期

```
                  loadInstance()
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADING                   │
    │            (加载 JS)                   │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              LOADED                    │
    │           (模块加载完成)                │
    └───────────────────────────────────────┘
                        │
                        ▼ (自动)
    ┌───────────────────────────────────────┐
    │             MOUNTING                   │
    │      (执行脚本，调用 render)            │
    └───────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────┐
    │              MOUNTED                   │
    │            (已挂载)                    │
    └───────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼ unmount()                 ▼ deactivated()
    ┌───────────┐              ┌───────────────┐
    │  UNMOUNT  │              │  DEACTIVATED  │
    └───────────┘              └───────────────┘
                                      │
                                      ▼ activated()
                               ┌───────────────┐
                               │   ACTIVATED   │
                               └───────────────┘
```

## 框架集成

### Vue 3 组合式 API

```vue
<template>
  <div
    ref="containerRef"
    class="micro-app-container"
  ></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadApp, mount, unmount } from '@blueking/bk-weweb';

  const containerRef = ref<HTMLElement | null>(null);
  const appId = 'my-app';

  onMounted(async () => {
    await loadApp({
      url: 'http://localhost:8001/',
      id: appId,
      scopeJs: true,
      scopeCss: true,
    });

    if (containerRef.value) {
      mount(appId, containerRef.value);
    }
  });

  onBeforeUnmount(() => {
    unmount(appId);
  });
</script>
```

### Vue 3 组合式函数 (Composable)

```typescript
// useMicroApp.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { loadApp, mount, unmount, type IAppModelProps } from '@blueking/bk-weweb';

export function useMicroApp(options: IAppModelProps, containerRef: Ref<HTMLElement | null>) {
  const loading = ref(true);
  const error = ref<Error | null>(null);

  onMounted(async () => {
    try {
      await loadApp(options);
      if (containerRef.value) {
        mount(options.id!, containerRef.value);
      }
      loading.value = false;
    } catch (e) {
      error.value = e as Error;
      loading.value = false;
    }
  });

  onBeforeUnmount(() => {
    if (options.id) {
      unmount(options.id);
    }
  });

  return { loading, error };
}

// 使用
const containerRef = ref<HTMLElement | null>(null);
const { loading, error } = useMicroApp(
  {
    url: 'http://localhost:8001/',
    id: 'my-app',
  },
  containerRef,
);
```

### React Hooks

```tsx
// useMicroApp.ts
import { useRef, useEffect, useState } from 'react';
import { loadApp, mount, unmount, type IAppModelProps } from '@blueking/bk-weweb';

export function useMicroApp(options: IAppModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMicroApp = async () => {
      try {
        await loadApp(options);
        if (containerRef.current) {
          mount(options.id!, containerRef.current);
        }
        setLoading(false);
      } catch (e) {
        setError(e as Error);
        setLoading(false);
      }
    };

    loadMicroApp();

    return () => {
      if (options.id) {
        unmount(options.id);
      }
    };
  }, [options.url, options.id]);

  return { containerRef, loading, error };
}

// 使用
const MicroAppComponent: React.FC = () => {
  const { containerRef, loading, error } = useMicroApp({
    url: 'http://localhost:8001/',
    id: 'my-app',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div ref={containerRef} />;
};
```

## 导入方式

```typescript
// 按需导入
import {
  load,
  loadApp,
  loadInstance,
  mount,
  unmount,
  unload,
  activated,
  deactivated,
  preLoadApp,
  preLoadInstance,
  preLoadSource,
  WewebMode,
} from '@blueking/bk-weweb';

// 默认导入主类
import weWeb from '@blueking/bk-weweb';
```

## 相关文档

- [load](./load.md) - 统一加载入口
- [loadApp](./load-app.md) - 加载微应用
- [loadInstance](./load-instance.md) - 加载微模块
- [mount](./mount.md) - 挂载
- [unmount](./unmount.md) - 卸载
- [activated](./activated.md) - 激活
- [deactivated](./deactivated.md) - 停用
- [unload](./unload.md) - 删除缓存
