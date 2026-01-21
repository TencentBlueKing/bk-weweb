# activated

## 概述

`activated` 用于**激活应用或模块**。它适用于 `keepAlive` 场景，可以恢复之前停用的应用状态。对于首次加载的应用，`activated` 的效果与 `mount` 相同。

## 函数签名

```typescript
function activated<T>(
  appKey: string,
  container: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void;
```

## 参数

| 参数        | 类型                        | 必填   | 说明                        |
| ----------- | --------------------------- | ------ | --------------------------- |
| `appKey`    | `string`                    | **是** | 应用/模块的唯一标识符（id） |
| `container` | `HTMLElement \| ShadowRoot` | **是** | 挂载容器                    |
| `callback`  | `Function`                  | 否     | 激活完成后的回调函数        |

### callback 回调参数

| 参数             | 类型        | 说明                         |
| ---------------- | ----------- | ---------------------------- |
| `instance`       | `BaseModel` | 应用/模块实例                |
| `exportInstance` | `T`         | 模块导出的实例（仅微模块有） |

## 返回值

```typescript
void
```

## 使用示例

### 基础用法

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

// 激活应用
activated('my-app', document.getElementById('container'));

// 停用应用（保留状态）
deactivated('my-app');

// 再次激活（恢复之前状态）
activated('my-app', document.getElementById('container'));
```

### 带回调

```typescript
import { loadApp, activated } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

activated('my-app', document.getElementById('container'), instance => {
  console.log('应用已激活');
  console.log('应用状态:', instance.status);
  console.log('是否预加载:', instance.isPreLoad);
});
```

### 微模块获取导出实例

```typescript
import { loadInstance, activated, WewebMode } from '@blueking/bk-weweb';

interface ChartExport {
  update: (options: any) => void;
  resize: () => void;
  getOption: () => any;
}

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  keepAlive: true,
});

activated<ChartExport>('chart-widget', document.getElementById('container'), (instance, exportInstance) => {
  console.log('图表模块已激活');

  if (exportInstance) {
    // 获取当前配置
    const options = exportInstance.getOption();
    console.log('图表配置:', options);

    // 调整大小
    exportInstance.resize();
  }
});
```

### Tab 切换场景

```vue
<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ active: activeTab === tab.id }"
      @click="switchTab(tab.id)"
    >
      {{ tab.name }}
    </button>
  </div>

  <div class="tab-content">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :id="`container-${tab.id}`"
      v-show="activeTab === tab.id"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

  interface Tab {
    id: string;
    name: string;
    url: string;
  }

  const tabs: Tab[] = [
    { id: 'dashboard', name: '仪表盘', url: 'http://localhost:8001/' },
    { id: 'orders', name: '订单', url: 'http://localhost:8002/' },
    { id: 'users', name: '用户', url: 'http://localhost:8003/' },
  ];

  const activeTab = ref('dashboard');
  const loadedTabs = new Set<string>();

  async function switchTab(tabId: string) {
    // 停用当前 Tab
    if (loadedTabs.has(activeTab.value)) {
      deactivated(activeTab.value);
    }

    activeTab.value = tabId;

    // 加载或激活新 Tab
    if (!loadedTabs.has(tabId)) {
      const tab = tabs.find(t => t.id === tabId)!;
      await loadApp({
        url: tab.url,
        id: tabId,
        keepAlive: true,
      });
      loadedTabs.add(tabId);
    }

    activated(tabId, document.getElementById(`container-${tabId}`)!);
  }

  onMounted(() => {
    switchTab('dashboard');
  });

  onBeforeUnmount(() => {
    // 清理所有已加载的 Tab
    for (const tabId of loadedTabs) {
      deactivated(tabId);
    }
  });
</script>
```

## 内部实现

```typescript
export function activated<T>(
  appKey: string,
  container: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void {
  const app = appCache.getApp(appKey);

  if (app?.status === AppState.DEACTIVATED && app.keepAlive) {
    // 已停用且支持 keepAlive，执行激活
    nextTask(() => {
      beforeLoad();
      app.activated(container, callback);
    });
  } else if (app) {
    // 否则执行常规挂载
    nextTask(() => {
      beforeLoad();
      app.mount(container, callback);
    });
  }
}
```

### activated vs mount

| 条件                            | activated 行为 |
| ------------------------------- | -------------- |
| 状态为 DEACTIVATED 且 keepAlive | 恢复之前状态   |
| 其他情况                        | 等同于 mount   |

## 状态流转

```
MOUNTED → deactivated() → DEACTIVATED → activated() → ACTIVATED
                                              ↓
                                        (恢复 DOM 和状态)
```

### keepAlive 激活过程

1. **转移 DOM 节点**

   - 将保留的 DOM 节点移动到新容器

2. **设置容器属性**

   - 更新 CSS 作用域属性

3. **激活沙箱**

   - 恢复沙箱环境

4. **更新状态**
   - 设置为 ACTIVATED

## 与 mount 的区别

| 特性               | activated       | mount    |
| ------------------ | --------------- | -------- |
| keepAlive 状态恢复 | ✅ 恢复之前状态 | 重新挂载 |
| DOM 保留           | ✅              | ❌       |
| 组件状态保留       | ✅              | ❌       |
| 滚动位置保留       | ✅              | ❌       |
| 首次加载           | 等同于 mount    | -        |

## 使用场景

### 场景一：Tab 切换

```typescript
// 切换 Tab 时使用 activated/deactivated
function switchTab(oldTab: string, newTab: string) {
  deactivated(oldTab);
  activated(newTab, document.getElementById(`tab-${newTab}`)!);
}
```

### 场景二：页面缓存

```typescript
// 页面路由切换时保持状态
router.beforeEach((to, from) => {
  if (from.meta.keepAlive) {
    deactivated(from.name);
  }
});

router.afterEach(to => {
  if (to.meta.keepAlive) {
    activated(to.name, document.getElementById('app-container')!);
  }
});
```

### 场景三：懒加载组件

```typescript
// 首次可见时激活，不可见时停用
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const appId = entry.target.dataset.appId!;
    if (entry.isIntersecting) {
      activated(appId, entry.target as HTMLElement);
    } else {
      deactivated(appId);
    }
  });
});
```

## 注意事项

### 1. container 参数必填

与 `mount` 不同，`activated` 要求必须传入 `container`：

```typescript
// ✅ 正确
activated('my-app', document.getElementById('container'));

// ❌ 错误：缺少 container
// activated('my-app');
```

### 2. 需要配合 keepAlive

要获得状态恢复能力，需要在加载时设置 `keepAlive: true`：

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true, // 必须设置
});
```

### 3. 检查应用是否存在

```typescript
import { loadApp, activated } from '@blueking/bk-weweb';

async function showApp(appId: string, url: string, container: HTMLElement) {
  try {
    // 尝试加载（如果已加载会复用）
    await loadApp({ url, id: appId, keepAlive: true });
    // 激活
    activated(appId, container);
  } catch (error) {
    console.error('激活失败:', error);
  }
}
```

## 类型定义

```typescript
/**
 * 激活指定应用
 * @param appKey - 应用的唯一标识符
 * @param container - 挂载容器
 * @param callback - 激活完成后的回调函数
 */
function activated<T>(
  appKey: string,
  container: HTMLElement | ShadowRoot,
  callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void,
): void;
```

## 相关函数

- [deactivated](./deactivated.md) - 停用
- [mount](./mount.md) - 挂载
- [loadApp](./load-app.md) - 加载微应用
- [loadInstance](./load-instance.md) - 加载微模块
