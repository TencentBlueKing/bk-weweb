# keepAlive 属性

## 概述

`keepAlive` 属性用于控制是否启用**缓存模式**。开启后，子应用在切换离开时不会被销毁，而是保留 DOM 状态，再次进入时恢复之前的状态，类似于 Vue 的 `keep-alive` 功能。

## 基本信息

| 属性     | 值                         |
| -------- | -------------------------- |
| 属性名   | `keepAlive` / `keep-alive` |
| 类型     | `boolean`                  |
| 是否必填 | 否                         |
| 默认值   | `false`                    |

## 使用方式

### Web Component

```html
<!-- 启用缓存模式 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :keep-alive="true"
/>

<!-- 不使用缓存模式（默认） -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :keep-alive="false"
/>
```

### Hooks API

```typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 启用缓存模式
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

// 激活应用
activated('my-app', document.getElementById('container'));

// 停用应用（保留状态）
deactivated('my-app');
```

## 详细说明

### 生命周期变化

启用 `keepAlive` 后，生命周期会有所不同：

```
普通模式:
  mount → mounted → unmount（销毁）

缓存模式:
  mount → mounted → deactivated（保留）→ activated（恢复）→ deactivated...
```

| 状态     | 普通模式                    | 缓存模式            |
| -------- | --------------------------- | ------------------- |
| 首次加载 | mount → mounted             | mount → mounted     |
| 离开页面 | unmount（销毁）             | deactivated（保留） |
| 再次进入 | mount → mounted（重新加载） | activated（恢复）   |
| DOM 状态 | 销毁                        | 保留                |
| JS 状态  | 销毁                        | 保留                |
| 样式     | 销毁                        | 保留在 head 中      |

### 状态保留范围

开启 `keepAlive` 后保留的内容：

| 内容类型 | 是否保留 | 说明                   |
| -------- | -------- | ---------------------- |
| DOM 结构 | ✅       | 完整保留               |
| 表单数据 | ✅       | 用户输入保留           |
| 滚动位置 | ✅       | 自动恢复               |
| 组件状态 | ✅       | Vue/React 组件状态保留 |
| 定时器   | ⚠️       | 需手动处理             |
| 事件监听 | ⚠️       | 需手动处理             |

### 样式处理

缓存模式下，样式会被移动到 `document.head` 中保留：

```html
<!-- 激活状态：样式在容器中 -->
<bk-weweb id="my-app">
  <style>
    ...
  </style>
  <div>...</div>
</bk-weweb>

<!-- 停用状态：样式移到 head 中 -->
<head>
  <style data-bk-weweb="my-app">
    ...
  </style>
</head>
<bk-weweb id="my-app">
  <!-- DOM 保留但不可见 -->
</bk-weweb>
```

## 使用场景

### 场景一：频繁切换的应用

用户频繁在多个子应用间切换：

```vue
<template>
  <div class="tabs">
    <button @click="activeTab = 'order'">订单</button>
    <button @click="activeTab = 'user'">用户</button>
  </div>

  <bk-weweb
    v-show="activeTab === 'order'"
    id="order-app"
    url="http://order.example.com/"
    :keep-alive="true"
  />

  <bk-weweb
    v-show="activeTab === 'user'"
    id="user-app"
    url="http://user.example.com/"
    :keep-alive="true"
  />
</template>
```

### 场景二：保留表单状态

用户填写表单后需要暂时切换到其他页面：

```html
<bk-weweb
  id="form-app"
  url="http://form.example.com/"
  :keep-alive="true"
/>
```

### 场景三：配合路由切换

与主应用路由配合使用：

```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<!-- 在路由组件中 -->
<template>
  <bk-weweb
    id="dashboard"
    url="http://dashboard.example.com/"
    :keep-alive="true"
  />
</template>
```

### 场景四：使用 Hooks 精细控制

```typescript
import { loadApp, activated, deactivated, unmount } from '@blueking/bk-weweb';

const appId = 'my-app';

// 初始化加载
await loadApp({
  url: 'http://localhost:8001/',
  id: appId,
  keepAlive: true,
});

// 激活应用
function showApp() {
  activated(appId, document.getElementById('container'));
}

// 停用应用（保留状态）
function hideApp() {
  deactivated(appId);
}

// 完全销毁（不再需要时）
function destroyApp() {
  unmount(appId);
}
```

## 注意事项

### 1. 内存占用

缓存的应用会持续占用内存：

```typescript
// 不再需要时应该销毁
import { unmount, unload } from '@blueking/bk-weweb';

// 卸载应用
unmount('my-app');

// 清除缓存
unload('http://localhost:8001/');
```

### 2. 定时器处理

子应用需要在适当的时机处理定时器：

```javascript
// 子应用中
let timer = null;

// 激活时启动
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    timer = setInterval(() => {}, 1000);
  } else {
    clearInterval(timer);
  }
});
```

### 3. 与 Shadow DOM 配合

`keepAlive` 和 `setShadowDom` 一起使用时，样式处理方式略有不同：

```html
<!-- Shadow DOM 内的样式无法移到 head 中 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :keep-alive="true"
  :set-shadow-dom="true"
/>
```

### 4. 事件清理

需要手动清理一些全局事件：

```javascript
// 子应用中
const handlers = [];

function addGlobalEvent(type, handler) {
  window.addEventListener(type, handler);
  handlers.push({ type, handler });
}

// 在 deactivated 时清理
function cleanup() {
  handlers.forEach(({ type, handler }) => {
    window.removeEventListener(type, handler);
  });
}
```

### 5. 缓存数量限制

建议限制同时缓存的应用数量：

```typescript
const MAX_CACHED_APPS = 5;
const cachedApps: string[] = [];

function cacheApp(appId: string) {
  if (cachedApps.length >= MAX_CACHED_APPS) {
    const oldApp = cachedApps.shift();
    unmount(oldApp);
  }
  cachedApps.push(appId);
}
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 是否启用缓存模式
   * @description 开启后应用切换时保留 DOM 状态
   * @default false
   */
  keepAlive?: boolean;

  // ... 其他属性
}
```

## 相关 Hooks

- [activated](../hooks/activated.md) - 激活应用
- [deactivated](../hooks/deactivated.md) - 停用应用
- [unmount](../hooks/unmount.md) - 卸载应用
- [unload](../hooks/unload.md) - 删除缓存

## 相关属性

- [id](./id.md) - 应用标识符
- [setShadowDom](./set-shadow-dom.md) - Shadow DOM 模式
