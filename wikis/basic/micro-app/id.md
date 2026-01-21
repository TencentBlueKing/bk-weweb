# id 属性

## 概述

`id` 属性用于定义微应用的**唯一标识符**，是应用在 BK-WeWeb 系统中的身份标识。

## 基本信息

| 属性     | 值                                                                           |
| -------- | ---------------------------------------------------------------------------- |
| 属性名   | `id`                                                                         |
| 类型     | `string`                                                                     |
| 是否必填 | 否（但强烈建议设置）                                                         |
| 默认值   | 如果未设置，将使用 `url` 作为标识；如果 `id` 与 `url` 相同，则生成随机字符串 |

## 使用方式

### Web Component

```html
<!-- 基础用法 -->
<bk-weweb
  id="my-dashboard"
  url="http://localhost:8001/"
/>

<!-- 多个相同应用使用不同 id -->
<bk-weweb
  id="dashboard-1"
  url="http://localhost:8001/"
/>
<bk-weweb
  id="dashboard-2"
  url="http://localhost:8001/"
/>
```

### Hooks API

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 使用 id 加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-dashboard', // 设置应用标识
});

// 后续操作使用 id 引用应用
mount('my-dashboard', document.getElementById('container'));
unmount('my-dashboard');
```

## 详细说明

### 标识符的作用

1. **应用缓存键**

   `id` 作为应用在缓存系统中的键名，用于：

   - 判断应用是否已加载
   - 复用已加载的应用资源
   - 在不同页面间共享应用状态

2. **CSS 作用域前缀**

   当开启 `scopeCss` 时，`id` 会作为 CSS 选择器的前缀：

   ```css
   /* 原始样式 */
   .header {
     color: red;
   }

   /* 处理后 */
   #my-dashboard .header {
     color: red;
   }
   ```

3. **生命周期操作引用**

   `mount`、`unmount`、`activated`、`deactivated` 等函数都需要通过 `id` 来引用目标应用。

### 标识符生成规则

```typescript
// 源码逻辑
this.name =
  props.id !== props.url
    ? props.id || random(5) // 使用 id 或生成随机字符串
    : random(5); // id 与 url 相同时生成随机字符串
```

- 如果设置了 `id` 且与 `url` 不同，使用 `id`
- 如果 `id` 与 `url` 相同或未设置 `id`，生成 5 位随机字符串

## 使用场景

### 场景一：应用复用

在不同页面使用相同的 `id`，可以复用已加载的应用资源：

```typescript
// Page A
<bk-weweb id="shared-app" url="http://localhost:8001/" />

// Page B - 使用相同的 id，会复用 Page A 已加载的资源
<bk-weweb id="shared-app" url="http://localhost:8001/" />
```

### 场景二：同应用多实例

需要在同一页面加载同一应用的多个实例时，使用不同的 `id`：

```typescript
// 两个不同的图表实例
<bk-weweb id="chart-1" url="http://localhost:8001/chart/" :data="JSON.stringify({type: 'line'})" />
<bk-weweb id="chart-2" url="http://localhost:8001/chart/" :data="JSON.stringify({type: 'bar'})" />
```

### 场景三：动态应用切换

通过改变 `id` 来切换不同的应用：

```vue
<template>
  <bk-weweb
    :id="currentAppId"
    :url="currentAppUrl"
    :key="currentAppId"
  />
</template>

<script setup>
  import { ref } from 'vue';

  const currentAppId = ref('app-1');
  const currentAppUrl = ref('http://localhost:8001/');

  function switchApp(id: string, url: string) {
    currentAppId.value = id;
    currentAppUrl.value = url;
  }
</script>
```

## 最佳实践

### 1. 始终显式设置 id

```typescript
// ✅ 推荐：显式设置 id
<bk-weweb id="user-center" url="http://localhost:8001/" />

// ❌ 不推荐：省略 id
<bk-weweb url="http://localhost:8001/" />
```

### 2. 使用有意义的命名

```typescript
// ✅ 推荐：语义化命名
<bk-weweb id="order-management" url="..." />
<bk-weweb id="user-dashboard" url="..." />

// ❌ 不推荐：无意义命名
<bk-weweb id="app1" url="..." />
<bk-weweb id="abc" url="..." />
```

### 3. 保持 id 全局唯一

```typescript
// ✅ 正确：不同应用使用不同 id
<bk-weweb id="order-app" url="http://order.example.com/" />
<bk-weweb id="user-app" url="http://user.example.com/" />

// ❌ 错误：不同应用使用相同 id
<bk-weweb id="my-app" url="http://order.example.com/" />
<bk-weweb id="my-app" url="http://user.example.com/" />  <!-- 冲突！ -->
```

## 类型定义

```typescript
interface IAppModelProps {
  /**
   * 应用唯一标识符
   * @description 用于标识应用，作为缓存键和 CSS 作用域前缀
   * @example 'user-dashboard'
   */
  id?: string | null;

  // ... 其他属性
}
```

## 相关属性

- [url](./url.md) - 应用入口 URL
- [mode](./mode.md) - 运行模式
- [keepAlive](./keep-alive.md) - 缓存模式（与 id 配合使用）
