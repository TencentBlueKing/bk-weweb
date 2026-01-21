# 快速上手

本指南将帮助你在 5 分钟内完成 BK-WeWeb 的基础接入。

## 环境要求

- Node.js >= 14.18.1
- 现代浏览器（Chrome 67+、Firefox 63+、Safari 10.1+、Edge 79+）

## 安装

使用你喜欢的包管理器安装：

```bash
# npm
npm install @blueking/bk-weweb

# yarn
yarn add @blueking/bk-weweb

# pnpm
pnpm add @blueking/bk-weweb
```

## 在主应用中引入

在主应用的入口文件中引入 BK-WeWeb：

```typescript
// main.ts 或 main.js
import '@blueking/bk-weweb';
```

引入后，`<bk-weweb>` 自定义元素会自动注册到全局。

## 基础使用

### 方式一：使用 Web Component 标签

这是最简单的使用方式，直接在模板中使用 `<bk-weweb>` 标签。

#### 嵌入微应用

```vue
<template>
  <div class="app-container">
    <h1>主应用</h1>

    <!-- 嵌入一个远程部署的完整应用 -->
    <bk-weweb
      id="child-app"
      url="http://localhost:8001/"
    />
  </div>
</template>
```

#### 嵌入微模块

```vue
<template>
  <div class="app-container">
    <h1>主应用</h1>

    <!-- 嵌入一个远程 JS 模块 -->
    <bk-weweb
      id="chart-module"
      mode="js"
      url="http://localhost:8002/chart.js"
    />
  </div>
</template>
```

### 方式二：使用 Hooks API

使用 Hooks 可以更精细地控制加载过程，推荐在需要传递复杂数据或需要获取加载回调时使用。

#### Vue 3 示例

```vue
<template>
  <div class="app-container">
    <div
      ref="containerRef"
      class="child-app-wrapper"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { loadApp, mount, unmount } from '@blueking/bk-weweb';

  const containerRef = ref<HTMLElement | null>(null);
  const appId = 'child-app';

  onMounted(async () => {
    // 1. 加载应用
    await loadApp({
      url: 'http://localhost:8001/',
      id: appId,
      scopeJs: true,
      scopeCss: true,
      data: {
        // 可以传递复杂对象，保持引用
        userInfo: { id: 1, name: 'admin' },
        permissions: ['read', 'write'],
      },
    });

    // 2. 挂载到容器
    mount(appId, containerRef.value!);
  });

  onBeforeUnmount(() => {
    // 3. 卸载应用
    unmount(appId);
  });
</script>

<style>
  .child-app-wrapper {
    width: 100%;
    height: 600px;
  }
</style>
```

#### React 示例

```tsx
import React, { useRef, useEffect } from 'react';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

const MicroAppContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appId = 'child-app';

  useEffect(() => {
    const loadMicroApp = async () => {
      // 1. 加载应用
      await loadApp({
        url: 'http://localhost:8001/',
        id: appId,
        scopeJs: true,
        scopeCss: true,
        data: {
          userInfo: { id: 1, name: 'admin' },
        },
      });

      // 2. 挂载到容器
      if (containerRef.current) {
        mount(appId, containerRef.current);
      }
    };

    loadMicroApp();

    // 3. 清理
    return () => {
      unmount(appId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px' }}
    />
  );
};

export default MicroAppContainer;
```

## 完整示例

以下是一个包含常用配置的完整示例：

```vue
<template>
  <div class="micro-frontend-demo">
    <!-- 带完整配置的微应用 -->
    <bk-weweb
      id="dashboard"
      url="http://localhost:8001/"
      :scope-js="true"
      :scope-css="true"
      :scope-location="false"
      :keep-alive="true"
      :show-source-code="false"
      :data="JSON.stringify(appData)"
    />

    <!-- 微模块 -->
    <bk-weweb
      id="chart-widget"
      mode="js"
      url="http://localhost:8002/widget.js"
      :scope-js="true"
      :scope-css="true"
    />
  </div>
</template>

<script setup lang="ts">
  const appData = {
    userId: '12345',
    token: 'xxx',
    theme: 'dark',
  };
</script>
```

## 子应用开发

子应用无需任何改造，但可以通过以下方式判断是否在 BK-WeWeb 环境中运行：

```typescript
// 判断是否在 bk-weweb 环境中
if (window.__POWERED_BY_BK_WEWEB__) {
  console.log('Running in BK-WeWeb');

  // 获取主应用传递的数据
  const data = window.__BK_WEWEB_DATA__;
  console.log('Received data:', data);

  // 获取当前应用的标识
  const appKey = window.__BK_WEWEB_APP_KEY__;
  console.log('App key:', appKey);
}
```

## 常见问题

### Q: 子应用加载失败？

1. 检查子应用的 CORS 配置，确保允许跨域访问
2. 检查子应用的入口 URL 是否正确
3. 查看浏览器控制台的错误信息

### Q: 样式冲突？

1. 确认 `scopeCss` 是否开启
2. 考虑使用 `setShadowDom` 获得更彻底的隔离
3. 检查子应用是否使用了 `!important`

### Q: 子应用路由不工作？

1. 如果子应用有独立路由，考虑开启 `scopeLocation`
2. 确认子应用的路由模式（hash/history）

## 下一步

- [微应用模式](../basic/micro-app/README.md) - 深入了解微应用配置
- [微模块模式](../basic/micro-module/README.md) - 深入了解微模块配置
- [Hooks API](../basic/hooks/README.md) - 了解所有可用的 Hooks
