# 自定义微模块容器

## 概述

与自定义微应用容器类似，你可以使用 Hooks API 创建自定义的微模块容器组件。微模块容器通常更轻量，主要用于加载远程 JavaScript 组件或插件。

## Vue 3 实现

### 基础版本

```vue
<template>
  <div
    class="micro-module-container"
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
      class="module-wrapper"
      :style="{ visibility: loading || error ? 'hidden' : 'visible' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import { loadInstance, activated, deactivated, WewebMode, type BaseModel } from '@blueking/bk-weweb';

  // Props 定义
  interface Props {
    /** 模块 URL */
    url: string;
    /** 模块唯一标识 */
    moduleId: string;
    /** 传递给模块的数据 */
    data?: Record<string, unknown>;
    /** 是否启用 JS 沙箱隔离 */
    scopeJs?: boolean;
    /** 是否启用 CSS 样式隔离 */
    scopeCss?: boolean;
    /** 是否启用缓存模式 */
    keepAlive?: boolean;
    /** 初始化资源 */
    initSource?: string[];
    /** 容器高度 */
    height?: string;
    /** 容器宽度 */
    width?: string;
  }

  // 导出实例类型
  interface ModuleExport {
    render?: (container: HTMLElement, data: any) => void | (() => void);
    update?: (data: any) => void;
    destroy?: () => void;
    [key: string]: unknown;
  }

  const props = withDefaults(defineProps<Props>(), {
    scopeJs: true,
    scopeCss: true,
    keepAlive: false,
    height: '100%',
    width: '100%',
  });

  // 事件定义
  const emit = defineEmits<{
    (e: 'loaded', instance: BaseModel, exportInstance?: ModuleExport): void;
    (e: 'error', error: Error): void;
    (e: 'loading', isLoading: boolean): void;
  }>();

  // 状态
  const containerRef = ref<HTMLElement | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);
  const moduleInstance = ref<BaseModel | null>(null);
  const exportInstance = ref<ModuleExport | null>(null);

  // 计算属性
  const containerStyle = computed(() => ({
    height: props.height,
    width: props.width,
    position: 'relative' as const,
  }));

  // 加载模块
  async function loadModule() {
    if (!containerRef.value) return;

    loading.value = true;
    error.value = null;
    emit('loading', true);

    try {
      const instance = await loadInstance({
        url: props.url,
        id: props.moduleId,
        mode: WewebMode.INSTANCE,
        container: containerRef.value,
        scopeJs: props.scopeJs,
        scopeCss: props.scopeCss,
        keepAlive: props.keepAlive,
        showSourceCode: true,
        data: props.data || {},
        initSource: props.initSource,
      });

      moduleInstance.value = instance;

      activated<ModuleExport>(props.moduleId, containerRef.value, (inst, exp) => {
        loading.value = false;
        exportInstance.value = exp || null;
        emit('loading', false);
        emit('loaded', inst, exp);
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
    loadModule();
  }

  // 更新模块数据
  function update(newData: Record<string, unknown>) {
    if (exportInstance.value?.update) {
      exportInstance.value.update(newData);
    }
  }

  // 监听 URL 变化
  watch(
    () => props.url,
    () => {
      if (props.moduleId) {
        deactivated(props.moduleId);
      }
      loadModule();
    },
  );

  // 监听数据变化
  watch(
    () => props.data,
    newData => {
      if (newData && exportInstance.value?.update) {
        exportInstance.value.update(newData);
      }
    },
    { deep: true },
  );

  // 生命周期
  onMounted(() => {
    loadModule();
  });

  onBeforeUnmount(() => {
    if (props.moduleId) {
      deactivated(props.moduleId);
    }
  });

  // 暴露方法
  defineExpose({
    reload,
    update,
    getInstance: () => moduleInstance.value,
    getExportInstance: () => exportInstance.value,
  });
</script>

<style scoped>
  .micro-module-container {
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

  .module-wrapper {
    flex: 1;
    overflow: auto;
  }
</style>
```

### 使用示例

```vue
<template>
  <div class="dashboard">
    <!-- 图表模块 -->
    <MicroModule
      ref="chartRef"
      url="http://localhost:8002/chart.js"
      module-id="sales-chart"
      :data="chartData"
      :init-source="['https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js']"
      height="400px"
      @loaded="onChartLoaded"
    />

    <!-- 表格模块 -->
    <MicroModule
      ref="tableRef"
      url="http://localhost:8002/table.js"
      module-id="data-table"
      :data="tableData"
      height="300px"
      @loaded="onTableLoaded"
    />

    <button @click="refreshCharts">刷新图表</button>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import MicroModule from './MicroModule.vue';

  const chartRef = ref<InstanceType<typeof MicroModule>>();
  const tableRef = ref<InstanceType<typeof MicroModule>>();

  const chartData = ref({
    type: 'line',
    title: '销售趋势',
    data: [100, 200, 150, 300, 250],
  });

  const tableData = ref({
    columns: ['日期', '销量', '金额'],
    rows: [
      ['2024-01-01', 100, 10000],
      ['2024-01-02', 150, 15000],
    ],
  });

  function onChartLoaded(instance: any, exportInstance: any) {
    console.log('图表已加载', exportInstance);
  }

  function onTableLoaded(instance: any, exportInstance: any) {
    console.log('表格已加载', exportInstance);
  }

  function refreshCharts() {
    chartRef.value?.reload();
  }
</script>
```

## React 实现

```tsx
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { loadInstance, activated, deactivated, WewebMode, type BaseModel } from '@blueking/bk-weweb';

interface ModuleExport {
  render?: (container: HTMLElement, data: any) => void | (() => void);
  update?: (data: any) => void;
  destroy?: () => void;
  [key: string]: unknown;
}

interface MicroModuleProps {
  url: string;
  moduleId: string;
  data?: Record<string, unknown>;
  scopeJs?: boolean;
  scopeCss?: boolean;
  keepAlive?: boolean;
  initSource?: string[];
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode | ((error: Error, retry: () => void) => React.ReactNode);
  onLoaded?: (instance: BaseModel, exportInstance?: ModuleExport) => void;
  onError?: (error: Error) => void;
}

interface MicroModuleRef {
  reload: () => void;
  update: (data: Record<string, unknown>) => void;
  getInstance: () => BaseModel | null;
  getExportInstance: () => ModuleExport | null;
}

const MicroModule = forwardRef<MicroModuleRef, MicroModuleProps>(
  (
    {
      url,
      moduleId,
      data,
      scopeJs = true,
      scopeCss = true,
      keepAlive = false,
      initSource,
      height = '100%',
      width = '100%',
      className,
      style,
      loadingComponent,
      errorComponent,
      onLoaded,
      onError,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<BaseModel | null>(null);
    const exportRef = useRef<ModuleExport | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadModule = useCallback(async () => {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const instance = await loadInstance({
          url,
          id: moduleId,
          mode: WewebMode.INSTANCE,
          container: containerRef.current,
          scopeJs,
          scopeCss,
          keepAlive,
          showSourceCode: true,
          data: data || {},
          initSource,
        });

        instanceRef.current = instance;

        activated<ModuleExport>(moduleId, containerRef.current, (inst, exp) => {
          setLoading(false);
          exportRef.current = exp || null;
          onLoaded?.(inst, exp);
        });
      } catch (e) {
        setLoading(false);
        setError(e as Error);
        onError?.(e as Error);
      }
    }, [url, moduleId, data, scopeJs, scopeCss, keepAlive, initSource, onLoaded, onError]);

    const reload = useCallback(() => {
      loadModule();
    }, [loadModule]);

    const update = useCallback((newData: Record<string, unknown>) => {
      if (exportRef.current?.update) {
        exportRef.current.update(newData);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        reload,
        update,
        getInstance: () => instanceRef.current,
        getExportInstance: () => exportRef.current,
      }),
      [reload, update],
    );

    useEffect(() => {
      loadModule();

      return () => {
        deactivated(moduleId);
      };
    }, [moduleId, loadModule]);

    useEffect(() => {
      if (data && exportRef.current?.update) {
        exportRef.current.update(data);
      }
    }, [data]);

    return (
      <div
        className={`micro-module-container ${className || ''}`}
        style={{ height, width, position: 'relative', ...style }}
      >
        {loading && <div className='loading-wrapper'>{loadingComponent || <div>加载中...</div>}</div>}

        {error && (
          <div className='error-wrapper'>
            {typeof errorComponent === 'function'
              ? errorComponent(error, reload)
              : errorComponent || (
                  <div>
                    <p>加载失败: {error.message}</p>
                    <button onClick={reload}>重试</button>
                  </div>
                )}
          </div>
        )}

        <div
          ref={containerRef}
          className='module-wrapper'
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

MicroModule.displayName = 'MicroModule';

export default MicroModule;
```

## 模块开发示例

### Vue 3 组件模块

```typescript
// chart-module/src/index.ts
import { createApp, type App } from 'vue';
import ChartComponent from './ChartComponent.vue';

let app: App | null = null;
let currentData: Record<string, unknown> = {};

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    currentData = data;

    app = createApp(ChartComponent, {
      ...data,
      onUpdate: (newData: any) => {
        currentData = { ...currentData, ...newData };
      },
    });

    app.mount(container);

    return () => {
      app?.unmount();
      app = null;
    };
  },

  update(newData: Record<string, unknown>) {
    currentData = { ...currentData, ...newData };
    // 如果需要响应式更新，可以通过 provide/inject 或 pinia 实现
  },

  getState() {
    return currentData;
  },
};
```

### React 组件模块

```tsx
// react-widget/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Widget from './Widget';

let root: ReactDOM.Root | null = null;
let currentData: Record<string, unknown> = {};

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    currentData = data;
    root = ReactDOM.createRoot(container);
    root.render(<Widget {...data} />);

    return () => {
      root?.unmount();
      root = null;
    };
  },

  update(newData: Record<string, unknown>) {
    currentData = { ...currentData, ...newData };
    if (root) {
      root.render(<Widget {...currentData} />);
    }
  },

  getState() {
    return currentData;
  },
};
```

### ECharts 图表模块

```typescript
// echarts-module/src/index.ts
import * as echarts from 'echarts';

let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { options, theme = 'light' } = data as {
      options: echarts.EChartOption;
      theme?: string;
    };

    // 初始化图表
    chart = echarts.init(container, theme);
    chart.setOption(options);

    // 响应容器大小变化
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver?.disconnect();
      chart?.dispose();
      chart = null;
    };
  },

  update(data: Record<string, unknown>) {
    if (chart && data.options) {
      chart.setOption(data.options as echarts.EChartOption, {
        notMerge: data.notMerge as boolean,
      });
    }
  },

  resize() {
    chart?.resize();
  },

  getOption() {
    return chart?.getOption();
  },

  getInstance() {
    return chart;
  },
};
```

## 构建配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyModule',
      formats: ['umd', 'es'],
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'echarts'],
      output: {
        globals: {
          vue: 'Vue',
          echarts: 'echarts',
        },
      },
    },
  },
  server: {
    cors: true,
  },
});
```

## 最佳实践

### 1. 模块通信

```typescript
// 创建模块间通信
function createModuleBus() {
  const listeners = new Map<string, Set<Function>>();

  return {
    on(event: string, callback: Function) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback);

      return () => listeners.get(event)?.delete(callback);
    },

    emit(event: string, data: any) {
      listeners.get(event)?.forEach(cb => cb(data));
    },
  };
}

// 传递给模块
const moduleBus = createModuleBus();

loadInstance({
  url: '...',
  id: 'module-a',
  data: { bus: moduleBus },
});

loadInstance({
  url: '...',
  id: 'module-b',
  data: { bus: moduleBus },
});
```

### 2. 错误边界

```vue
<template>
  <div class="module-error-boundary">
    <template v-if="hasError">
      <slot
        name="fallback"
        :error="error"
        :reset="reset"
      >
        <div class="error-fallback">
          <p>模块加载失败</p>
          <button @click="reset">重试</button>
        </div>
      </slot>
    </template>
    <template v-else>
      <slot></slot>
    </template>
  </div>
</template>

<script setup>
  import { ref, onErrorCaptured } from 'vue';

  const hasError = ref(false);
  const error = ref(null);

  onErrorCaptured(err => {
    hasError.value = true;
    error.value = err;
    return false;
  });

  function reset() {
    hasError.value = false;
    error.value = null;
  }
</script>
```

## 相关文档

- [微模块模式](../basic/micro-module/README.md)
- [render 规范](../basic/micro-module/render-specification.md)
- [自定义微应用容器](./custom-micro-app.md)
