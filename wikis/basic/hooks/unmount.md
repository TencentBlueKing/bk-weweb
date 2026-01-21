# unmount

## 概述

`unmount` 用于**卸载应用或模块**，清理 DOM 并停用沙箱。卸载后应用资源仍保留在缓存中，可以再次挂载。

## 函数签名

```typescript
function unmount(appKey: string): void;
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
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载并挂载
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
mount('my-app', document.getElementById('container'));

// 卸载
unmount('my-app');
```

### Vue 3 组件中使用

```vue
<template>
  <div ref="containerRef"></div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadApp, mount, unmount } from '@blueking/bk-weweb';

  const containerRef = ref<HTMLElement | null>(null);
  const appId = 'my-app';

  onMounted(async () => {
    await loadApp({ url: 'http://localhost:8001/', id: appId });
    mount(appId, containerRef.value!);
  });

  onBeforeUnmount(() => {
    unmount(appId);
  });
</script>
```

### React 组件中使用

```tsx
import React, { useRef, useEffect } from 'react';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

const MicroApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appId = 'my-app';

  useEffect(() => {
    const init = async () => {
      await loadApp({ url: 'http://localhost:8001/', id: appId });
      if (containerRef.current) {
        mount(appId, containerRef.current);
      }
    };

    init();

    // 组件卸载时清理
    return () => {
      unmount(appId);
    };
  }, []);

  return <div ref={containerRef} />;
};
```

### 条件卸载

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

let isLoaded = false;

async function showApp() {
  if (!isLoaded) {
    await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
    isLoaded = true;
  }
  mount('my-app', document.getElementById('container'));
}

function hideApp() {
  unmount('my-app');
}

// 切换显示/隐藏
function toggleApp() {
  const container = document.getElementById('container');
  if (container?.children.length) {
    hideApp();
  } else {
    showApp();
  }
}
```

## 内部实现

```typescript
export function unmount(appKey: string): void {
  const app = appCache.getApp(appKey);

  if (app && app.status !== AppState.UNMOUNT) {
    app.unmount();
  }

  if (!appCache.hasActiveApp) {
    resetBodyAndHeaderMethods();
  }
}
```

### 卸载时执行的操作

1. **清理容器 DOM**

   ```typescript
   if (this.container) {
     this.container.innerHTML = '';
     this.container = undefined;
   }
   ```

2. **停用沙箱**

   ```typescript
   this.sandBox?.deactivated();
   ```

3. **更新状态**

   ```typescript
   this.state = AppState.UNMOUNT;
   ```

4. **重置全局方法**（如果没有活跃应用）
   ```typescript
   if (!appCache.hasActiveApp) {
     resetBodyAndHeaderMethods();
   }
   ```

## 与 deactivated 的区别

| 特性     | unmount        | deactivated          |
| -------- | -------------- | -------------------- |
| DOM 状态 | 清除           | 保留（keepAlive 时） |
| 沙箱状态 | 停用           | 停用                 |
| 缓存资源 | 保留           | 保留                 |
| 再次使用 | 需要重新 mount | 使用 activated 恢复  |
| 适用场景 | 通用卸载       | keepAlive 场景       |

```typescript
// 普通卸载
unmount('my-app'); // DOM 被清除

// keepAlive 场景
deactivated('my-app'); // DOM 保留，只是隐藏
activated('my-app', container); // 恢复显示
```

## 与 unload 的区别

| 特性     | unmount    | unload        |
| -------- | ---------- | ------------- |
| 清除 DOM | ✅         | ✅            |
| 清除缓存 | ❌         | ✅            |
| 再次使用 | 直接 mount | 需要重新 load |

```typescript
// unmount 后可以直接 mount
unmount('my-app');
mount('my-app', newContainer); // 可以

// unload 后需要重新 load
unload('http://localhost:8001/');
// mount('my-app', container);  // 无效
await loadApp({ url: 'http://localhost:8001/', id: 'my-app' });
mount('my-app', container); // 可以
```

## 注意事项

### 1. 状态检查

```typescript
// unmount 会检查状态，已卸载的应用不会重复卸载
unmount('my-app');
unmount('my-app'); // 第二次调用无效，不会报错
```

### 2. 事件清理

子应用在卸载时应该清理自己的事件监听器：

```typescript
// 子应用中
const handler = () => {
  /* ... */
};
window.addEventListener('resize', handler);

// 在卸载前清理
window.addEventListener('beforeunload', () => {
  window.removeEventListener('resize', handler);
});
```

### 3. 定时器清理

```typescript
// 子应用中的定时器应该在适当时机清理
const timer = setInterval(() => {
  /* ... */
}, 1000);

// 可以监听 visibilitychange
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(timer);
  }
});
```

## 类型定义

```typescript
/**
 * 卸载指定应用
 * @param appKey - 应用的唯一标识符
 */
function unmount(appKey: string): void;
```

## 相关函数

- [mount](./mount.md) - 挂载
- [unload](./unload.md) - 删除缓存
- [deactivated](./deactivated.md) - 停用（keepAlive 场景）
