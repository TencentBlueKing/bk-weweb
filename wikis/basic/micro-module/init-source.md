# initSource 属性（微模块）

## 概述

`initSource` 属性用于指定微模块的**依赖资源**。这些资源会在模块加载前预先加载。

## 基本信息

| 属性     | 值                                      |
| -------- | --------------------------------------- |
| 属性名   | `initSource`                            |
| 类型     | `string[] \| (() => Promise<string[]>)` |
| 是否必填 | 否                                      |
| 默认值   | `[]`                                    |
| 支持方式 | 仅 Hooks API                            |

## 使用方式

### 静态资源列表

```typescript
import { loadInstance, WewebMode } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  initSource: [
    'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js',
    'https://cdn.jsdelivr.net/npm/echarts-gl@2/dist/echarts-gl.min.js',
  ],
});
```

### 动态资源列表

```typescript
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'dynamic-widget',
  mode: WewebMode.INSTANCE,
  initSource: async () => {
    const response = await fetch('/api/widget-deps');
    return response.json();
  },
});
```

## 使用场景

### 场景一：图表库依赖

```typescript
await loadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'echarts-widget',
  mode: WewebMode.INSTANCE,
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js'],
});
```

### 场景二：Vue 2 组件

```typescript
await loadInstance({
  url: 'http://localhost:8002/vue2-component.js',
  id: 'legacy-widget',
  mode: WewebMode.INSTANCE,
  initSource: [
    'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js',
    'https://cdn.jsdelivr.net/npm/element-ui/lib/index.js',
    'https://cdn.jsdelivr.net/npm/element-ui/lib/theme-chalk/index.css',
  ],
});
```

### 场景三：地图组件

```typescript
await loadInstance({
  url: 'http://localhost:8002/map.js',
  id: 'map-widget',
  mode: WewebMode.INSTANCE,
  initSource: [
    'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js',
    'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css',
  ],
});
```

## 资源加载顺序

```
1. 加载 initSource 中的资源
   ↓
2. 获取模块 JS 文件
   ↓
3. 执行模块代码
   ↓
4. 调用 render 方法
```

## 类型定义

```typescript
type SourceFuncType = () => Promise<string[]>;
type SourceType = string[] | SourceFuncType;

interface IJsModelProps {
  /**
   * 初始化资源列表
   * @description 模块加载前预先加载的依赖
   */
  initSource?: SourceType;

  // ... 其他属性
}
```

## 相关属性

- [url](./url.md) - 模块 URL
- [预加载](../../advanced/preload.md) - 预加载策略
