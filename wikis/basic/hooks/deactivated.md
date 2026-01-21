# deactivated

## 概述

`deactivated` 用于**停用应用或模块**。它适用于 `keepAlive` 场景，会保留应用的 DOM 状态，后续可以通过 `activated` 恢复。

## 函数签名

```typescript
function deactivated(appKey: string): void;
```

## 参数

| 参数     | 类型     | 必填   | 说明                        |
| -------- | -------- | ------ | --------------------------- |
| `appKey` | `string` | **是** | 应用/模块的唯一标识符（id） |

## 返回值

```typescript
void
```

## 使用示例

### 基础用法

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 加载应用（开启 keepAlive）
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

// 激活
activated('my-app', document.getElementById('container'));

// 停用（保留状态）
deactivated('my-app');

// 再次激活（恢复状态）
activated('my-app', document.getElementById('container'));
```

### Vue 3 组件中使用

```vue
<template>
  <div
    ref="containerRef"
    v-show="isVisible"
  ></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

  const props = defineProps<{
    visible: boolean;
  }>();

  const containerRef = ref<HTMLElement | null>(null);
  const appId = 'my-app';
  const isVisible = ref(props.visible);

  onMounted(async () => {
    await loadApp({
      url: 'http://localhost:8001/',
      id: appId,
      keepAlive: true,
    });

    if (isVisible.value && containerRef.value) {
      activated(appId, containerRef.value);
    }
  });

  watch(
    () => props.visible,
    newVal => {
      isVisible.value = newVal;

      if (newVal && containerRef.value) {
        activated(appId, containerRef.value);
      } else {
        deactivated(appId);
      }
    },
  );

  onBeforeUnmount(() => {
    deactivated(appId);
  });
</script>
```

### Tab 切换场景

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

const apps = {
  dashboard: 'http://localhost:8001/',
  orders: 'http://localhost:8002/',
  users: 'http://localhost:8003/',
};

let currentApp: string | null = null;

async function switchApp(appId: string) {
  // 停用当前应用
  if (currentApp) {
    deactivated(currentApp);
  }

  // 加载新应用（如果未加载）
  if (!isLoaded(appId)) {
    await loadApp({
      url: apps[appId as keyof typeof apps],
      id: appId,
      keepAlive: true,
    });
  }

  // 激活新应用
  activated(appId, document.getElementById(`container-${appId}`)!);
  currentApp = appId;
}

function isLoaded(appId: string): boolean {
  // 检查应用是否已加载
  return !!document.querySelector(`[data-app-id="${appId}"]`);
}
```

### 条件显示/隐藏

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

let isActive = false;

async function toggleApp() {
  if (!isActive) {
    // 首次加载或激活
    if (!isLoaded('my-app')) {
      await loadApp({
        url: 'http://localhost:8001/',
        id: 'my-app',
        keepAlive: true,
      });
    }
    activated('my-app', document.getElementById('container')!);
    isActive = true;
  } else {
    // 停用
    deactivated('my-app');
    isActive = false;
  }
}
```

## 内部实现

```typescript
export function deactivated(appKey: string) {
  const app = appCache.getApp(appKey);

  if (app && [AppState.ACTIVATED, AppState.MOUNTED].some(status => status === app.status)) {
    app.keepAlive ? app.deactivated() : app.unmount();
  }

  if (!appCache.hasActiveApp) {
    resetBodyAndHeaderMethods();
  }
}
```

### 行为逻辑

| 条件             | 行为                               |
| ---------------- | ---------------------------------- |
| keepAlive: true  | 调用 `app.deactivated()`，保留 DOM |
| keepAlive: false | 调用 `app.unmount()`，清除 DOM     |

## 状态流转

```
MOUNTED/ACTIVATED → deactivated() → DEACTIVATED
                                        ↓
                          activated() → ACTIVATED
```

### deactivated 过程

1. **停用沙箱**

   ```typescript
   this.sandBox?.deactivated();
   ```

2. **更新状态**

   ```typescript
   this.state = AppState.DEACTIVATED;
   ```

3. **保留 DOM**（keepAlive 模式）
   - DOM 节点保持在容器中
   - 样式移到 document.head

## 与 unmount 的区别

| 特性     | deactivated          | unmount    |
| -------- | -------------------- | ---------- |
| DOM 状态 | 保留（keepAlive 时） | 清除       |
| 组件状态 | 保留                 | 丢失       |
| 表单数据 | 保留                 | 丢失       |
| 滚动位置 | 保留                 | 丢失       |
| 定时器   | 需手动处理           | 需手动处理 |
| 恢复方式 | activated            | mount      |

```typescript
// keepAlive 场景
deactivated('my-app'); // 保留状态
activated('my-app', container); // 恢复状态

// 普通场景
unmount('my-app'); // 清除状态
mount('my-app', container); // 重新挂载
```

## 注意事项

### 1. 需要配合 keepAlive

如果 `keepAlive` 为 `false`，`deactivated` 的行为等同于 `unmount`：

```typescript
// keepAlive: false 时
deactivated('my-app'); // 等同于 unmount('my-app')
```

### 2. 内存管理

停用的应用仍然占用内存，长时间不使用应该考虑卸载：

```typescript
// 停用一段时间后未使用，考虑完全卸载
setTimeout(
  () => {
    if (!isAppNeeded('my-app')) {
      unmount('my-app');
    }
  },
  5 * 60 * 1000,
); // 5 分钟后
```

### 3. 定时器和动画

停用时应该暂停定时器和动画：

```typescript
// 子应用中
let animationFrame: number;
let timer: number;

function startAnimation() {
  animationFrame = requestAnimationFrame(animate);
  timer = setInterval(tick, 1000);
}

function stopAnimation() {
  cancelAnimationFrame(animationFrame);
  clearInterval(timer);
}

// 监听页面可见性变化来处理停用
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});
```

### 4. 状态检查

只有处于 `MOUNTED` 或 `ACTIVATED` 状态的应用才能被停用：

```typescript
// 重复调用是安全的
deactivated('my-app');
deactivated('my-app'); // 第二次无效，不会报错
```

## 使用场景

### 场景一：Tab 页签

用户切换 Tab 时，保留之前 Tab 的状态。

### 场景二：折叠面板

展开/折叠面板时，保留面板内容状态。

### 场景三：模态框

关闭模态框时保留表单数据，再次打开时恢复。

### 场景四：懒加载

滚动出可视区域时停用，滚动回来时激活。

## 类型定义

```typescript
/**
 * 停用指定应用
 * @param appKey - 应用的唯一标识符
 */
function deactivated(appKey: string): void;
```

## 相关函数

- [activated](./activated.md) - 激活
- [unmount](./unmount.md) - 卸载
- [loadApp](./load-app.md) - 加载微应用
