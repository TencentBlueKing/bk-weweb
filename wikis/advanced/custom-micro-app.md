# 自定义微应用容器

## 概述

虽然 BK-WeWeb 提供了开箱即用的 `<bk-weweb>` Web Component，但在某些场景下，你可能需要创建自定义的微应用容器组件。使用 Hooks API 可以完全控制微应用的加载、挂载和卸载过程。

## 为什么需要自定义容器

1. **保持数据引用**：直接传递对象，无需 JSON 序列化
2. **更好的类型支持**：完整的 TypeScript 类型推导
3. **框架集成**：与 Vue/React 的生命周期深度集成
4. **自定义 UI**：添加加载状态、错误处理等 UI
5. **事件监听**：监听加载、挂载、错误等事件

## Vue 3 实现

### 基础版本

```vue
<template>
  <div
    class="micro-app-container"
    :style="containerStyle"
  >
    <div
      v-if="loading"
      class="loading-wrapper"
    >
      <slot name="loading">
        <div class="default-loading">加载中...</div>
      </slot>
    </div>

    <div
      v-if="error"
      class="error-wrapper"
    >
      <slot
        name="error"
        :error="error"
      >
        <div class="default-error">
          <p>加载失败: {{ error.message }}</p>
          <button @click="reload">重试</button>
        </div>
      </slot>
    </div>

    <div
      ref="containerRef"
      class="app-wrapper"
      :style="{ visibility: loading || error ? 'hidden' : 'visible' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import { loadApp, mount, unmount, activated, deactivated, type BaseModel } from '@blueking/bk-weweb';

  // Props 定义
  interface Props {
    /** 应用入口 URL */
    url: string;
    /** 应用唯一标识 */
    appId: string;
    /** 传递给子应用的数据 */
    data?: Record<string, unknown>;
    /** 是否启用 JS 沙箱隔离 */
    scopeJs?: boolean;
    /** 是否启用 CSS 样式隔离 */
    scopeCss?: boolean;
    /** 是否启用路由隔离 */
    scopeLocation?: boolean;
    /** 是否使用 Shadow DOM */
    setShadowDom?: boolean;
    /** 是否启用缓存模式 */
    keepAlive?: boolean;
    /** 容器高度 */
    height?: string;
    /** 容器宽度 */
    width?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    scopeJs: true,
    scopeCss: true,
    scopeLocation: false,
    setShadowDom: false,
    keepAlive: false,
    height: '100%',
    width: '100%',
  });

  // 事件定义
  const emit = defineEmits<{
    (e: 'mounted', instance: BaseModel): void;
    (e: 'unmounted'): void;
    (e: 'error', error: Error): void;
    (e: 'loading', isLoading: boolean): void;
  }>();

  // 状态
  const containerRef = ref<HTMLElement | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);
  const appInstance = ref<BaseModel | null>(null);

  // 计算属性
  const containerStyle = computed(() => ({
    height: props.height,
    width: props.width,
    position: 'relative' as const,
  }));

  // 加载微应用
  async function loadMicroApp() {
    if (!containerRef.value) return;

    loading.value = true;
    error.value = null;
    emit('loading', true);

    try {
      const instance = await loadApp({
        url: props.url,
        id: props.appId,
        scopeJs: props.scopeJs,
        scopeCss: props.scopeCss,
        scopeLocation: props.scopeLocation,
        setShadowDom: props.setShadowDom,
        keepAlive: props.keepAlive,
        data: props.data || {},
      });

      appInstance.value = instance;

      mount(props.appId, containerRef.value, inst => {
        loading.value = false;
        emit('loading', false);
        emit('mounted', inst);
      });
    } catch (e) {
      loading.value = false;
      error.value = e as Error;
      emit('loading', false);
      emit('error', e as Error);
    }
  }

  // 重新加载
  function reload() {
    loadMicroApp();
  }

  // 监听 URL 变化
  watch(
    () => props.url,
    () => {
      if (props.appId) {
        unmount(props.appId);
      }
      loadMicroApp();
    },
  );

  // 监听数据变化
  watch(
    () => props.data,
    newData => {
      if (appInstance.value) {
        appInstance.value.data = newData || {};
      }
    },
    { deep: true },
  );

  // 生命周期
  onMounted(() => {
    loadMicroApp();
  });

  onBeforeUnmount(() => {
    if (props.appId) {
      if (props.keepAlive) {
        deactivated(props.appId);
      } else {
        unmount(props.appId);
      }
      emit('unmounted');
    }
  });

  // 暴露方法
  defineExpose({
    reload,
    getInstance: () => appInstance.value,
  });
</script>

<style scoped>
  .micro-app-container {
    display: flex;
    flex-direction: column;
  }

  .loading-wrapper,
  .error-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    z-index: 10;
  }

  .default-loading {
    color: #666;
  }

  .default-error {
    text-align: center;
    color: #ff4d4f;
  }

  .default-error button {
    margin-top: 12px;
    padding: 6px 16px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

  .default-error button:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .app-wrapper {
    flex: 1;
    overflow: auto;
  }
</style>
```

### 使用自定义容器

```vue
<template>
  <MicroApp
    url="http://localhost:8001/"
    app-id="dashboard"
    :data="appData"
    :scope-location="true"
    height="600px"
    @mounted="onMounted"
    @error="onError"
  >
    <template #loading>
      <div class="custom-loading">
        <Spinner />
        <span>正在加载应用...</span>
      </div>
    </template>

    <template #error="{ error }">
      <div class="custom-error">
        <Icon type="error" />
        <p>{{ error.message }}</p>
        <Button @click="retry">重新加载</Button>
      </div>
    </template>
  </MicroApp>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import MicroApp from './MicroApp.vue';
  import type { BaseModel } from '@blueking/bk-weweb';

  const microAppRef = ref<InstanceType<typeof MicroApp>>();

  const appData = ref({
    userId: '12345',
    token: 'xxx',
    config: { theme: 'dark' },
  });

  function onMounted(instance: BaseModel) {
    console.log('应用已加载:', instance.name);
  }

  function onError(error: Error) {
    console.error('应用加载失败:', error);
  }

  function retry() {
    microAppRef.value?.reload();
  }
</script>
```

## React 实现

### 基础版本

```tsx
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { loadApp, mount, unmount, deactivated, type BaseModel, type IAppModelProps } from '@blueking/bk-weweb';

// Props 类型
interface MicroAppProps {
  url: string;
  appId: string;
  data?: Record<string, unknown>;
  scopeJs?: boolean;
  scopeCss?: boolean;
  scopeLocation?: boolean;
  setShadowDom?: boolean;
  keepAlive?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode | ((error: Error, retry: () => void) => React.ReactNode);
  onMounted?: (instance: BaseModel) => void;
  onUnmounted?: () => void;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

// Ref 类型
interface MicroAppRef {
  reload: () => void;
  getInstance: () => BaseModel | null;
}

// 组件实现
const MicroApp = forwardRef<MicroAppRef, MicroAppProps>(
  (
    {
      url,
      appId,
      data,
      scopeJs = true,
      scopeCss = true,
      scopeLocation = false,
      setShadowDom = false,
      keepAlive = false,
      height = '100%',
      width = '100%',
      className,
      style,
      loadingComponent,
      errorComponent,
      onMounted,
      onUnmounted,
      onError,
      onLoading,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<BaseModel | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // 加载微应用
    const loadMicroApp = useCallback(async () => {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);
      onLoading?.(true);

      try {
        const instance = await loadApp({
          url,
          id: appId,
          scopeJs,
          scopeCss,
          scopeLocation,
          setShadowDom,
          keepAlive,
          data: data || {},
        });

        instanceRef.current = instance;

        mount(appId, containerRef.current, inst => {
          setLoading(false);
          onLoading?.(false);
          onMounted?.(inst);
        });
      } catch (e) {
        setLoading(false);
        setError(e as Error);
        onLoading?.(false);
        onError?.(e as Error);
      }
    }, [url, appId, scopeJs, scopeCss, scopeLocation, setShadowDom, keepAlive, data, onMounted, onError, onLoading]);

    // 重新加载
    const reload = useCallback(() => {
      loadMicroApp();
    }, [loadMicroApp]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        reload,
        getInstance: () => instanceRef.current,
      }),
      [reload],
    );

    // 初始加载
    useEffect(() => {
      loadMicroApp();

      return () => {
        if (keepAlive) {
          deactivated(appId);
        } else {
          unmount(appId);
        }
        onUnmounted?.();
      };
    }, [appId, loadMicroApp, keepAlive, onUnmounted]);

    // 监听 data 变化
    useEffect(() => {
      if (instanceRef.current && data) {
        instanceRef.current.data = data;
      }
    }, [data]);

    // 渲染加载状态
    const renderLoading = () => {
      if (!loading) return null;
      return <div className='micro-app-loading'>{loadingComponent || <div>加载中...</div>}</div>;
    };

    // 渲染错误状态
    const renderError = () => {
      if (!error) return null;
      return (
        <div className='micro-app-error'>
          {typeof errorComponent === 'function'
            ? errorComponent(error, reload)
            : errorComponent || (
                <div>
                  <p>加载失败: {error.message}</p>
                  <button onClick={reload}>重试</button>
                </div>
              )}
        </div>
      );
    };

    return (
      <div
        className={`micro-app-container ${className || ''}`}
        style={{
          height,
          width,
          position: 'relative',
          ...style,
        }}
      >
        {renderLoading()}
        {renderError()}
        <div
          ref={containerRef}
          className='micro-app-wrapper'
          style={{
            flex: 1,
            visibility: loading || error ? 'hidden' : 'visible',
            overflow: 'auto',
          }}
        />
      </div>
    );
  },
);

MicroApp.displayName = 'MicroApp';

export default MicroApp;
```

### 使用自定义容器

```tsx
import React, { useRef, useState } from 'react';
import MicroApp, { type MicroAppRef } from './MicroApp';

const App: React.FC = () => {
  const microAppRef = useRef<MicroAppRef>(null);

  const [appData] = useState({
    userId: '12345',
    token: 'xxx',
    config: { theme: 'dark' },
  });

  return (
    <div className='app-container'>
      <MicroApp
        ref={microAppRef}
        url='http://localhost:8001/'
        appId='dashboard'
        data={appData}
        scopeLocation
        height={600}
        loadingComponent={<CustomSpinner />}
        errorComponent={(error, retry) => (
          <div className='custom-error'>
            <p>{error.message}</p>
            <button onClick={retry}>重试</button>
          </div>
        )}
        onMounted={instance => {
          console.log('App mounted:', instance.name);
        }}
        onError={error => {
          console.error('App error:', error);
        }}
      />

      <button onClick={() => microAppRef.current?.reload()}>刷新应用</button>
    </div>
  );
};
```

## 自定义 Hooks

### Vue 3 Composable

```typescript
// useMicroApp.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { loadApp, mount, unmount, type IAppModelProps, type BaseModel } from '@blueking/bk-weweb';

interface UseMicroAppOptions extends IAppModelProps {
  immediate?: boolean;
}

interface UseMicroAppReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  instance: Ref<BaseModel | null>;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  unloadApp: () => void;
}

export function useMicroApp(containerRef: Ref<HTMLElement | null>, options: UseMicroAppOptions): UseMicroAppReturn {
  const { immediate = true, ...appOptions } = options;

  const loading = ref(false);
  const error = ref<Error | null>(null);
  const instance = ref<BaseModel | null>(null);

  async function load() {
    if (!containerRef.value) return;

    loading.value = true;
    error.value = null;

    try {
      const app = await loadApp(appOptions);
      instance.value = app;
      mount(appOptions.id!, containerRef.value);
      loading.value = false;
    } catch (e) {
      error.value = e as Error;
      loading.value = false;
    }
  }

  async function reload() {
    unloadApp();
    await load();
  }

  function unloadApp() {
    if (appOptions.id) {
      unmount(appOptions.id);
      instance.value = null;
    }
  }

  onMounted(() => {
    if (immediate) {
      load();
    }
  });

  onBeforeUnmount(() => {
    unloadApp();
  });

  return {
    loading,
    error,
    instance,
    load,
    reload,
    unloadApp,
  };
}
```

### React Hook

```typescript
// useMicroApp.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import { loadApp, mount, unmount, type IAppModelProps, type BaseModel } from '@blueking/bk-weweb';

interface UseMicroAppOptions extends IAppModelProps {
  immediate?: boolean;
}

interface UseMicroAppReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  loading: boolean;
  error: Error | null;
  instance: BaseModel | null;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  unloadApp: () => void;
}

export function useMicroApp(options: UseMicroAppOptions): UseMicroAppReturn {
  const { immediate = true, ...appOptions } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<BaseModel | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [instance, setInstance] = useState<BaseModel | null>(null);

  const load = useCallback(async () => {
    if (!containerRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const app = await loadApp(appOptions);
      instanceRef.current = app;
      setInstance(app);
      mount(appOptions.id!, containerRef.current);
      setLoading(false);
    } catch (e) {
      setError(e as Error);
      setLoading(false);
    }
  }, [appOptions]);

  const unloadApp = useCallback(() => {
    if (appOptions.id) {
      unmount(appOptions.id);
      instanceRef.current = null;
      setInstance(null);
    }
  }, [appOptions.id]);

  const reload = useCallback(async () => {
    unloadApp();
    await load();
  }, [unloadApp, load]);

  useEffect(() => {
    if (immediate) {
      load();
    }

    return () => {
      unloadApp();
    };
  }, [immediate, load, unloadApp]);

  return {
    containerRef,
    loading,
    error,
    instance,
    load,
    reload,
    unloadApp,
  };
}
```

## 最佳实践

### 1. 错误边界

```tsx
// React 错误边界
class MicroAppErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 使用
<MicroAppErrorBoundary fallback={<ErrorUI />}>
  <MicroApp
    url='...'
    appId='...'
  />
</MicroAppErrorBoundary>;
```

### 2. 懒加载

```vue
<template>
  <div ref="observerTarget">
    <MicroApp
      v-if="isVisible"
      :url="url"
      :app-id="appId"
    />
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';

  const observerTarget = ref(null);
  const isVisible = ref(false);
  let observer: IntersectionObserver;

  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      isVisible.value = entry.isIntersecting;
    });
    observer.observe(observerTarget.value);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
  });
</script>
```

### 3. 通信封装

```typescript
// 创建通信桥接
function createBridge(appId: string) {
  const handlers = new Map<string, Function[]>();

  return {
    emit(event: string, data: any) {
      window.dispatchEvent(new CustomEvent(`${appId}:${event}`, { detail: data }));
    },

    on(event: string, handler: Function) {
      if (!handlers.has(event)) {
        handlers.set(event, []);
        window.addEventListener(`${appId}:${event}`, (e: CustomEvent) => {
          handlers.get(event)?.forEach(h => h(e.detail));
        });
      }
      handlers.get(event)!.push(handler);
    },
  };
}

// 传递给子应用
const bridge = createBridge('my-app');
loadApp({
  url: '...',
  id: 'my-app',
  data: { bridge },
});
```

## 相关文档

- [Hooks API](../basic/hooks/README.md)
- [loadApp](../basic/hooks/load-app.md)
- [自定义微模块](./custom-micro-module.md)
