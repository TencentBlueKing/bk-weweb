# data 属性（微模块）

## 概述

`data` 属性用于向微模块**传递数据**。数据会作为 `render` 方法的第二个参数传入。

## 基本信息

| 属性     | 值                        |
| -------- | ------------------------- |
| 属性名   | `data`                    |
| 类型     | `Record<string, unknown>` |
| 是否必填 | 否                        |
| 默认值   | `{}`                      |

## 使用方式

### Web Component

```html
<bk-weweb
  id="chart-widget"
  mode="js"
  url="http://localhost:8002/chart.js"
  :data="JSON.stringify({ chartType: 'line', title: '销售趋势' })"
/>
```

### Hooks API

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  data: {
    chartType: 'line',
    title: '销售趋势',
    config: {
      showLegend: true,
      animation: true,
    },
  },
});
```

## 数据接收方式

### 在 render 方法中

模块的 `render` 方法第二个参数即为传递的数据：

```typescript
// 模块代码
export default {
  render(container: HTMLElement, data: Record<string, unknown>) {
    const { chartType, title, config } = data;

    console.log(chartType); // 'line'
    console.log(title); // '销售趋势'
    console.log(config); // { showLegend: true, animation: true }

    // 使用数据渲染
  },
};
```

### 在沙箱环境中

如果开启了 `scopeJs`，也可以通过 `window.__BK_WEWEB_DATA__` 访问：

```typescript
// 模块代码
if (window.__POWERED_BY_BK_WEWEB__) {
  const data = window.__BK_WEWEB_DATA__;
}
```

## 使用场景

### 场景一：配置参数

```typescript
await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'sales-chart',
  mode: WewebMode.INSTANCE,
  data: {
    type: 'bar',
    data: [100, 200, 150, 300],
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  },
});
```

### 场景二：传递方法

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'interactive-widget',
  mode: WewebMode.INSTANCE,
  data: {
    onItemClick: item => {
      console.log('Item clicked:', item);
    },
    fetchData: async () => {
      return await api.getData();
    },
  },
});
```

### 场景三：响应式更新

通过获取导出实例的 `update` 方法更新数据：

```typescript
let exportedModule: any;

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  data: { type: 'line' },
});

activated('chart-widget', container, (instance, exp) => {
  exportedModule = exp;
});

// 更新数据
function updateChart(newData: any) {
  if (exportedModule?.update) {
    exportedModule.update(newData);
  }
}
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 传递给模块的数据
   * @description 作为 render 方法的第二个参数
   */
  data?: Record<string, unknown>;

  // ... 其他属性
}
```

## 相关属性

- [id](./id.md) - 模块标识符
- [render 规范](./render-specification.md) - 模块导出规范
