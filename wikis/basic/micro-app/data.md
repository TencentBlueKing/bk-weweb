# data 属性

## 概述

`data` 属性用于向子应用**传递数据**。传递的数据将注入到子应用的 `window.__BK_WEWEB_DATA__` 对象中，子应用可以在运行时访问这些数据。

## 基本信息

| 属性     | 值                                                                       |
| -------- | ------------------------------------------------------------------------ |
| 属性名   | `data`                                                                   |
| 类型     | Web Component: `string`（JSON 字符串），Hooks: `Record<string, unknown>` |
| 是否必填 | 否                                                                       |
| 默认值   | `{}`                                                                     |

## 使用方式

### Web Component

在 Web Component 模式下，`data` 需要传递 JSON 字符串：

```html
<!-- 基础用法 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :data="JSON.stringify({ userId: '123' })"
/>

<!-- 完整示例 -->
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :data="appDataString"
/>

<script setup>
  import { computed } from 'vue';

  const appData = {
    userId: '12345',
    userName: 'admin',
    token: 'xxx-xxx-xxx',
    permissions: ['read', 'write', 'delete'],
    config: {
      theme: 'dark',
      language: 'zh-CN',
    },
  };

  const appDataString = computed(() => JSON.stringify(appData));
</script>
```

### Hooks API

使用 Hooks 时可以直接传递对象，**保持数据引用**：

```typescript
import { loadApp } from '@blueking/bk-weweb';

const appData = {
  userId: '12345',
  userName: 'admin',
  token: 'xxx-xxx-xxx',
  permissions: ['read', 'write', 'delete'],
  config: {
    theme: 'dark',
    language: 'zh-CN',
  },
};

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: appData, // 直接传递对象，保持引用
});
```

## 详细说明

### 数据访问方式

子应用中访问传递的数据：

```javascript
// 子应用入口文件

// 判断是否在 bk-weweb 环境中
if (window.__POWERED_BY_BK_WEWEB__) {
  // 获取传递的数据
  const data = window.__BK_WEWEB_DATA__;

  console.log(data.userId); // '12345'
  console.log(data.permissions); // ['read', 'write', 'delete']
  console.log(data.config); // { theme: 'dark', language: 'zh-CN' }
}
```

### Web Component vs Hooks 的数据传递差异

| 特性       | Web Component    | Hooks API    |
| ---------- | ---------------- | ------------ |
| 数据格式   | JSON 字符串      | 原始对象     |
| 数据引用   | 序列化后丢失引用 | 保持原始引用 |
| 函数传递   | ❌ 不支持        | ✅ 支持      |
| 复杂对象   | ⚠️ 需可序列化    | ✅ 任意对象  |
| 响应式更新 | 需重新序列化     | 直接更新     |

```typescript
// Web Component 方式 - 引用丢失
const data = { count: 0 };
// data 会被序列化再解析，子应用拿到的是新对象
<bk-weweb :data="JSON.stringify(data)" />

// Hooks 方式 - 保持引用
const data = { count: 0 };
await loadApp({ ..., data });
// 子应用拿到的是同一个对象引用
// 主应用修改 data.count，子应用也能看到变化
```

### 传递函数和方法

使用 Hooks API 可以传递函数：

```typescript
import { loadApp } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    // 传递函数
    showMessage: (msg: string) => {
      alert(msg);
    },

    // 传递方法
    api: {
      fetchUser: async (id: string) => {
        return await fetch(`/api/user/${id}`);
      },
    },

    // 传递事件发射器
    eventBus: {
      emit: (event: string, data: any) => {
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
      },
    },
  },
});

// 子应用中使用
const { showMessage, api, eventBus } = window.__BK_WEWEB_DATA__;
showMessage('Hello!');
await api.fetchUser('123');
eventBus.emit('custom-event', { foo: 'bar' });
```

## 使用场景

### 场景一：传递用户信息

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    user: {
      id: '12345',
      name: 'admin',
      avatar: 'https://example.com/avatar.png',
    },
    token: 'Bearer xxx',
  },
});
```

### 场景二：传递配置信息

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    config: {
      apiBaseUrl: 'https://api.example.com',
      theme: 'dark',
      language: 'zh-CN',
      features: {
        enableNotification: true,
        enableAnalytics: false,
      },
    },
  },
});
```

### 场景三：传递共享状态

```typescript
import { reactive } from 'vue';

// 创建响应式共享状态
const sharedState = reactive({
  count: 0,
  items: [],
});

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    sharedState,
    updateCount: (value: number) => {
      sharedState.count = value;
    },
  },
});
```

### 场景四：传递通信方法

```typescript
// 创建事件总线
const eventBus = {
  handlers: new Map(),

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  },

  emit(event: string, data: any) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  },
};

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  data: {
    eventBus,
  },
});

// 主应用监听子应用事件
eventBus.on('child-event', data => {
  console.log('Received from child:', data);
});
```

## 注意事项

### 1. Web Component 的数据限制

```html
<!-- ❌ 错误：函数无法序列化 -->
<bk-weweb :data="JSON.stringify({ onClick: () => {} })" />

<!-- ✅ 正确：只传递可序列化数据 -->
<bk-weweb :data="JSON.stringify({ userId: '123' })" />
```

### 2. 避免循环引用

```typescript
// ❌ 错误：循环引用无法序列化
const obj = { name: 'test' };
obj.self = obj; // 循环引用

// 会抛出 "Converting circular structure to JSON" 错误
JSON.stringify(obj);
```

### 3. 数据更新

Web Component 方式需要重新渲染才能更新数据：

```vue
<template>
  <bk-weweb
    :key="dataVersion"
    :data="JSON.stringify(appData)"
  />
</template>

<script setup>
  import { ref, reactive } from 'vue';

  const dataVersion = ref(0);
  const appData = reactive({ count: 0 });

  function updateData() {
    appData.count++;
    dataVersion.value++; // 触发重新渲染
  }
</script>
```

Hooks 方式可以直接更新引用：

```typescript
const data = { count: 0 };

await loadApp({ ..., data });

// 直接更新，子应用可以看到变化
data.count = 1;
```

### 4. 类型安全

```typescript
// 定义数据类型
interface AppData {
  userId: string;
  permissions: string[];
  config: {
    theme: 'light' | 'dark';
    language: string;
  };
}

// 主应用
const data: AppData = {
  userId: '123',
  permissions: ['read'],
  config: { theme: 'dark', language: 'zh-CN' }
};

await loadApp({ ..., data });

// 子应用
declare global {
  interface Window {
    __BK_WEWEB_DATA__: AppData;
  }
}

const { userId, permissions, config } = window.__BK_WEWEB_DATA__;
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 传递给子应用的数据
   * @description Web Component 需要 JSON 字符串，Hooks 可以传递任意对象
   * @default {}
   */
  data?: Record<string, unknown>;

  // ... 其他属性
}

// 子应用中的全局类型
interface Window {
  __BK_WEWEB_DATA__: Record<string, unknown>;
}
```

## 相关属性

- [id](./id.md) - 应用标识符
- [scopeJs](./scope-js.md) - JS 沙箱隔离
