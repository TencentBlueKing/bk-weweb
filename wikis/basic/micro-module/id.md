# id 属性（微模块）

## 概述

`id` 属性用于定义微模块的**唯一标识符**。在微模块模式下，`id` 是必需的，用于标识和管理模块实例。

## 基本信息

| 属性     | 值                     |
| -------- | ---------------------- |
| 属性名   | `id`                   |
| 类型     | `string`               |
| 是否必填 | **是**（微模块模式下） |
| 默认值   | -                      |

## 使用方式

### Web Component

```html
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/chart.js"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget', // 必须指定
  mode: WewebMode.INSTANCE,
});
```

## 详细说明

### 与微应用 id 的区别

| 特性          | 微应用 id      | 微模块 id             |
| ------------- | -------------- | --------------------- |
| 是否必填      | 否（有默认值） | 是                    |
| 作为 CSS 前缀 | ✅             | ✅                    |
| 作为缓存键    | ✅             | ✅                    |
| 容器 ID 后缀  | ✅             | ✅（`${id}-wrapper`） |

### 容器命名

微模块会自动创建一个容器 div，其 ID 格式为 `${id}-wrapper`：

```html
<!-- 生成的 DOM 结构 -->
<bk-weweb
  id="chart-widget"
  mode="js"
  url="..."
>
  <div id="chart-widget-wrapper">
    <!-- 模块内容 -->
  </div>
</bk-weweb>
```

## 使用场景

### 场景一：多实例模块

```typescript
// 加载多个图表实例
await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'sales-chart', // 销售图表
  mode: WewebMode.INSTANCE,
});

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'traffic-chart', // 流量图表
  mode: WewebMode.INSTANCE,
});
```

### 场景二：动态模块管理

```typescript
// 动态加载和卸载模块
const moduleRegistry = new Map<string, boolean>();

async function loadModule(id: string, url: string) {
  if (!moduleRegistry.has(id)) {
    await loadInstance({ url, id, mode: WewebMode.INSTANCE });
    moduleRegistry.set(id, true);
  }
}

function unloadModule(id: string) {
  if (moduleRegistry.has(id)) {
    deactivated(id);
    moduleRegistry.delete(id);
  }
}
```

## 最佳实践

```typescript
// ✅ 推荐：使用有意义的命名
await loadInstance({ id: 'dashboard-chart', url: '...', mode: 'js' });
await loadInstance({ id: 'user-analytics', url: '...', mode: 'js' });

// ❌ 不推荐：无意义命名
await loadInstance({ id: 'mod1', url: '...', mode: 'js' });
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 模块唯一标识符
   * @required
   */
  id: string;

  // ... 其他属性
}
```

## 相关属性

- [url](./url.md) - 模块 URL
- [mode](./mode.md) - 运行模式
