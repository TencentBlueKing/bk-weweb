# initSource 属性

## 概述

`initSource` 属性用于指定子应用的**初始化资源**。这些资源（JS、CSS）会在子应用加载前预先加载，通常用于加载子应用依赖的公共库或样式。

## 基本信息

| 属性     | 值                                      |
| -------- | --------------------------------------- |
| 属性名   | `initSource`                            |
| 类型     | `string[] \| (() => Promise<string[]>)` |
| 是否必填 | 否                                      |
| 默认值   | `[]`                                    |
| 支持方式 | 仅 Hooks API（Web Component 不支持）    |

## 使用方式

### 静态资源列表

```typescript
import { loadApp } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  initSource: [
    'https://cdn.example.com/vue@2.6.14/vue.min.js',
    'https://cdn.example.com/echarts@5.0.0/echarts.min.js',
    'https://cdn.example.com/element-ui@2.15.0/index.css',
  ],
});
```

### 动态资源列表

```typescript
import { loadApp } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  initSource: async () => {
    // 从配置接口获取资源列表
    const response = await fetch('/api/app-resources');
    const { scripts, styles } = await response.json();
    return [...scripts, ...styles];
  },
});
```

## 详细说明

### 资源加载顺序

```
1. 加载 initSource 中的资源
   ↓
2. 获取子应用 HTML
   ↓
3. 解析子应用资源
   ↓
4. 执行样式
   ↓
5. 执行脚本
```

### 资源类型识别

BK-WeWeb 通过 URL 后缀识别资源类型：

| 后缀   | 类型       | 处理方式     |
| ------ | ---------- | ------------ |
| `.js`  | JavaScript | 作为脚本加载 |
| `.css` | CSS        | 作为样式加载 |
| 其他   | 忽略       | 输出警告     |

```typescript
// 识别逻辑
const JS_FILE_REGEX = /\.js$/;
const CSS_FILE_REGEX = /\.css$/;

if (JS_FILE_REGEX.test(pathname)) {
  // 作为脚本处理
} else if (CSS_FILE_REGEX.test(pathname)) {
  // 作为样式处理
}
```

### 资源缓存

初始化资源会被缓存到全局，多个子应用可以共享：

```typescript
// 应用 A 加载了 Vue
await loadApp({
  id: 'app-a',
  url: 'http://a.example.com/',
  initSource: ['https://cdn.example.com/vue.min.js'],
});

// 应用 B 使用相同的 Vue，会复用缓存
await loadApp({
  id: 'app-b',
  url: 'http://b.example.com/',
  initSource: ['https://cdn.example.com/vue.min.js'], // 从缓存读取
});
```

## 使用场景

### 场景一：加载公共库

子应用依赖的第三方库：

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'vue2-app',
  initSource: [
    'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js',
    'https://cdn.jsdelivr.net/npm/vuex@3.6.2/dist/vuex.min.js',
    'https://cdn.jsdelivr.net/npm/vue-router@3.5.2/dist/vue-router.min.js',
  ],
});
```

### 场景二：加载 UI 框架

子应用使用的 UI 框架：

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'element-app',
  initSource: [
    'https://cdn.jsdelivr.net/npm/element-ui@2.15.0/lib/index.js',
    'https://cdn.jsdelivr.net/npm/element-ui@2.15.0/lib/theme-chalk/index.css',
  ],
});
```

### 场景三：加载图表库

子应用使用的图表库：

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'chart-app',
  initSource: [
    'https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js',
    'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.0/dist/echarts-gl.min.js',
  ],
});
```

### 场景四：动态配置资源

根据环境或配置动态加载：

```typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'dynamic-app',
  initSource: async () => {
    // 根据环境选择资源
    const cdnBase = process.env.CDN_URL || 'https://cdn.example.com';
    const version = await getAppVersion('my-app');

    return [`${cdnBase}/vue@${version.vue}/vue.min.js`, `${cdnBase}/axios@${version.axios}/axios.min.js`];
  },
});
```

### 场景五：主子应用共享资源

主应用和子应用共享相同的库：

```typescript
// 主应用启动时预加载
import { preLoadSource } from '@blueking/bk-weweb';

preLoadSource(['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/axios.min.js']);

// 子应用加载时复用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'child-app',
  initSource: [
    'https://cdn.example.com/vue.min.js', // 从缓存读取
    'https://cdn.example.com/axios.min.js', // 从缓存读取
  ],
});
```

## 注意事项

### 1. 资源跨域

确保资源服务器允许跨域访问：

```
Access-Control-Allow-Origin: *
```

### 2. 加载顺序

initSource 中的资源会按顺序加载，如果有依赖关系需要注意顺序：

```typescript
initSource: [
  'https://cdn.example.com/vue.min.js', // 先加载 Vue
  'https://cdn.example.com/vuex.min.js', // 再加载依赖 Vue 的库
  'https://cdn.example.com/vue-router.min.js',
];
```

### 3. 错误处理

资源加载失败不会阻止子应用加载，但可能导致运行时错误：

```typescript
try {
  await loadApp({
    url: 'http://localhost:8001/',
    id: 'my-app',
    initSource: ['https://cdn.example.com/lib.js'],
  });
} catch (error) {
  console.error('资源加载失败:', error);
}
```

### 4. 与 external 配置配合

子应用构建时配置 external，运行时通过 initSource 提供：

```javascript
// 子应用 webpack.config.js
module.exports = {
  externals: {
    vue: 'Vue',
    axios: 'axios',
  },
};

// 主应用加载时提供
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  initSource: ['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/axios.min.js'],
});
```

### 5. 性能优化

使用 CDN 加速和预加载优化性能：

```typescript
// 预加载常用资源
import { preLoadSource } from '@blueking/bk-weweb';

// 页面加载后预加载
window.addEventListener('load', () => {
  preLoadSource(['https://cdn.example.com/vue.min.js', 'https://cdn.example.com/common.css']);
});
```

## 类型定义

```typescript
/**
 * 资源类型
 */
type SourceFuncType = () => Promise<string[]>;
type SourceType = string[] | SourceFuncType;

interface IAppModelProps {
  /**
   * 初始化资源列表
   * @description 子应用加载前预先加载的资源
   * @default []
   */
  initSource?: SourceType;

  // ... 其他属性
}
```

## 相关功能

- [预加载](../../advanced/preload.md) - 预加载资源
- [url](./url.md) - 应用入口地址
