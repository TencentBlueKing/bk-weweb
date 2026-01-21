/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
/**
 * 示例代码工具
 * 提供各种使用场景的示例代码
 */

import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 示例代码数据
const EXAMPLES: Record<string, string> = {
  'basic-app': `# 基础微应用示例

最简单的微应用接入方式。

## 主应用代码

\`\`\`typescript
// main.ts
import '@blueking/bk-weweb';
\`\`\`

\`\`\`vue
<!-- App.vue -->
<template>
  <div class="main-app">
    <header>主应用头部</header>

    <!-- 嵌入子应用 -->
    <bk-weweb
      id="child-app"
      url="http://localhost:8001/"
    />

    <footer>主应用底部</footer>
  </div>
</template>
\`\`\`

## 子应用（无需改造）

子应用可以是任何前端应用，无需任何特殊处理。

\`\`\`typescript
// 可选：检测是否在 bk-weweb 环境中
if (window.__POWERED_BY_BK_WEWEB__) {
  console.log('运行在 BK-WeWeb 环境中');
  console.log('应用 ID:', window.__BK_WEWEB_APP_KEY__);
  console.log('传递的数据:', window.__BK_WEWEB_DATA__);
}
\`\`\``,

  'basic-module': `# 基础微模块示例

加载远程 JS 模块作为组件。

## 主应用代码

\`\`\`vue
<template>
  <div class="main-app">
    <h1>主应用</h1>

    <!-- 嵌入微模块 -->
    <bk-weweb
      id="chart-widget"
      mode="js"
      url="http://localhost:8002/widget.js"
    />
  </div>
</template>
\`\`\`

## 微模块代码

\`\`\`typescript
// widget.js
export default {
  render(container, data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-widget';
    wrapper.innerHTML = \`
      <h3>图表组件</h3>
      <div class="chart-content">
        <p>接收到的数据: \${JSON.stringify(data)}</p>
      </div>
    \`;
    container.appendChild(wrapper);
  },

  update(data) {
    // 更新逻辑
    console.log('更新数据:', data);
  },

  destroy() {
    // 清理逻辑
    console.log('组件销毁');
  }
};
\`\`\``,

  'data-passing': `# 数据传递示例

主应用向子应用传递数据。

## Web Component 方式

\`\`\`vue
<template>
  <bk-weweb
    id="child-app"
    url="http://localhost:8001/"
    :data="JSON.stringify(appData)"
  />
</template>

<script setup>
const appData = {
  userId: '12345',
  token: 'jwt-token-xxx',
  theme: 'dark',
  permissions: ['read', 'write', 'admin'],
  config: {
    apiBase: 'https://api.example.com',
    timeout: 5000,
  }
};
</script>
\`\`\`

## Hooks 方式（推荐，保持引用）

\`\`\`typescript
import { loadApp, mount } from '@blueking/bk-weweb';

const appData = {
  userId: '12345',
  token: 'jwt-token-xxx',
  // 可以传递函数
  onMessage: (msg) => {
    console.log('收到子应用消息:', msg);
  },
  // 可以传递 Vue/React 响应式对象
  store: myStore,
};

await loadApp({
  url: 'http://localhost:8001/',
  id: 'child-app',
  data: appData,  // 直接传递对象，保持引用
});

mount('child-app', container);
\`\`\`

## 子应用接收数据

\`\`\`typescript
// 子应用中
const data = window.__BK_WEWEB_DATA__;

console.log('用户 ID:', data.userId);
console.log('Token:', data.token);

// 调用主应用传入的函数
data.onMessage?.('Hello from child app!');

// 访问共享的 store
data.store?.dispatch('someAction');
\`\`\``,

  'keep-alive': `# KeepAlive 缓存示例

实现多应用切换时保持状态。

\`\`\`vue
<template>
  <div class="multi-app">
    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="app in apps"
        :key="app.id"
        :class="{ active: activeApp === app.id }"
        @click="switchApp(app.id)"
      >
        {{ app.name }}
      </button>
    </div>

    <!-- 应用容器 -->
    <div ref="containerRef" class="app-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

const containerRef = ref<HTMLElement | null>(null);
const activeApp = ref('');

const apps = [
  { id: 'app-1', name: '应用 1', url: 'http://localhost:8001/' },
  { id: 'app-2', name: '应用 2', url: 'http://localhost:8002/' },
  { id: 'app-3', name: '应用 3', url: 'http://localhost:8003/' },
];

// 预加载所有应用
onMounted(async () => {
  for (const app of apps) {
    await loadApp({
      url: app.url,
      id: app.id,
      keepAlive: true,  // 启用缓存
      scopeJs: true,
      scopeCss: true,
    });
  }

  // 默认激活第一个
  switchApp(apps[0].id);
});

// 切换应用
function switchApp(appId: string) {
  // 停用当前应用
  if (activeApp.value) {
    deactivated(activeApp.value);
  }

  // 激活新应用
  activeApp.value = appId;
  if (containerRef.value) {
    activated(appId, containerRef.value);
  }
}

onBeforeUnmount(() => {
  if (activeApp.value) {
    deactivated(activeApp.value);
  }
});
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button.active {
  background: #1890ff;
  color: white;
}

.app-container {
  width: 100%;
  min-height: 500px;
  border: 1px solid #e8e8e8;
}
</style>
\`\`\``,

  preload: `# 预加载示例

利用空闲时间预加载资源，提升用户体验。

\`\`\`typescript
import { preLoadApp, preLoadInstance, preLoadSource } from '@blueking/bk-weweb';

// 方式 1: 使用 requestIdleCallback
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // 预加载微应用
    preLoadApp({
      url: 'http://localhost:8001/',
      id: 'dashboard',
      scopeJs: true,
      scopeCss: true,
    });

    // 预加载微模块
    preLoadInstance({
      url: 'http://localhost:8002/widget.js',
      id: 'chart-widget',
      mode: 'js',
    });
  });
}

// 方式 2: 预加载公共资源
preLoadSource([
  'https://cdn.example.com/vue.min.js',
  'https://cdn.example.com/echarts.min.js',
  'https://cdn.example.com/common.css',
]);

// 方式 3: 路由级预加载
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 监听路由变化，预加载即将访问的应用
router.beforeEach((to, from) => {
  if (to.name === 'dashboard') {
    preLoadApp({
      url: 'http://localhost:8001/',
      id: 'dashboard',
    });
  }
});
\`\`\``,

  'shadow-dom': `# Shadow DOM 示例

使用 Shadow DOM 实现深度样式隔离。

\`\`\`vue
<template>
  <div class="app">
    <!-- 普通模式：CSS 添加前缀隔离 -->
    <bk-weweb
      id="normal-app"
      url="http://localhost:8001/"
      :scope-css="true"
    />

    <!-- Shadow DOM 模式：完全隔离 -->
    <bk-weweb
      id="shadow-app"
      url="http://localhost:8002/"
      :set-shadow-dom="true"
    />
  </div>
</template>
\`\`\`

## Shadow DOM 模式注意事项

\`\`\`typescript
// 子应用中访问 Shadow DOM
if (window.__POWERED_BY_BK_WEWEB__) {
  // 获取 Shadow Root
  const shadowRoot = document.querySelector('#shadow-app')?.shadowRoot;

  // 在 Shadow DOM 中查询元素
  const element = shadowRoot?.querySelector('.my-element');

  // 添加样式到 Shadow DOM
  const style = document.createElement('style');
  style.textContent = \`
    .my-element {
      color: red;
    }
  \`;
  shadowRoot?.appendChild(style);
}

// 处理弹窗等需要挂载到 body 的组件
// 需要使用 teleport 或自定义挂载点
import { Teleport } from 'vue';

// Vue 3 中
<Teleport to="body">
  <div class="modal">弹窗内容</div>
</Teleport>
\`\`\``,

  'scope-location': `# 路由隔离示例

使子应用拥有独立的路由系统。

\`\`\`vue
<template>
  <div class="multi-app-page">
    <!-- 两个子应用同时显示，各自有独立路由 -->
    <div class="app-panel">
      <h3>应用 1</h3>
      <bk-weweb
        id="app-1"
        url="http://localhost:8001/"
        :scope-location="true"
      />
    </div>

    <div class="app-panel">
      <h3>应用 2</h3>
      <bk-weweb
        id="app-2"
        url="http://localhost:8002/"
        :scope-location="true"
      />
    </div>
  </div>
</template>
\`\`\`

## 路由隔离原理

启用 \`scopeLocation\` 后，BK-WeWeb 会为子应用创建一个隐藏的 iframe，提供独立的 location 和 history 对象。

\`\`\`typescript
// 子应用中
if (window.__POWERED_BY_BK_WEWEB__) {
  // 这是代理的 location，不会影响浏览器地址栏
  console.log(window.location.href);  // 子应用的虚拟路由

  // 如需访问真实的 location
  console.log(window.rawWindow.location.href);  // 浏览器真实地址
}
\`\`\`

## 使用场景

1. **多应用同屏展示**：每个应用有自己的路由，互不干扰
2. **保持主应用路由**：子应用路由变化不影响浏览器地址栏
3. **路由状态隔离**：子应用的前进/后退不影响主应用`,

  'custom-container': `# 自定义容器示例

使用 Hooks API 完全控制微应用/微模块的加载和渲染。

## 自定义微应用容器

\`\`\`vue
<template>
  <div class="custom-micro-app">
    <div class="loading" v-if="loading">
      <span class="spinner"></span>
      加载中...
    </div>
    <div class="error" v-else-if="error">
      <p>加载失败: {{ error.message }}</p>
      <button @click="retry">重试</button>
    </div>
    <div ref="containerRef" class="app-content" v-show="!loading && !error"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { loadApp, mount, unmount, unload } from '@blueking/bk-weweb';

const props = defineProps<{
  appId: string;
  url: string;
  data?: Record<string, unknown>;
}>();

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref<Error | null>(null);

async function loadMicroApp() {
  loading.value = true;
  error.value = null;

  try {
    await loadApp({
      url: props.url,
      id: props.appId,
      scopeJs: true,
      scopeCss: true,
      data: props.data,
    });

    if (containerRef.value) {
      mount(props.appId, containerRef.value, () => {
        loading.value = false;
      });
    }
  } catch (e) {
    error.value = e as Error;
    loading.value = false;
  }
}

function retry() {
  // 清除缓存后重试
  unload(props.url);
  loadMicroApp();
}

onMounted(() => {
  loadMicroApp();
});

// 监听 data 变化，重新加载
watch(() => props.data, (newData) => {
  if (newData) {
    unmount(props.appId);
    unload(props.url);
    loadMicroApp();
  }
}, { deep: true });

onBeforeUnmount(() => {
  unmount(props.appId);
});
</script>

<style scoped>
.custom-micro-app {
  position: relative;
  min-height: 200px;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 20px;
  color: #ff4d4f;
}

.app-content {
  width: 100%;
  min-height: 400px;
}
</style>
\`\`\``,

  'multi-framework': `# 多框架共存示例

在同一个页面中集成不同技术栈的子应用。

\`\`\`vue
<template>
  <div class="multi-framework-app">
    <header>
      <h1>多框架微前端示例</h1>
      <p>主应用: Vue 3</p>
    </header>

    <div class="apps-grid">
      <!-- Vue 2 子应用 -->
      <div class="app-card">
        <h3>Vue 2 应用</h3>
        <bk-weweb
          id="vue2-app"
          url="http://localhost:8001/"
          :scope-js="true"
          :scope-css="true"
        />
      </div>

      <!-- React 子应用 -->
      <div class="app-card">
        <h3>React 应用</h3>
        <bk-weweb
          id="react-app"
          url="http://localhost:8002/"
          :scope-js="true"
          :scope-css="true"
        />
      </div>

      <!-- Angular 子应用 -->
      <div class="app-card">
        <h3>Angular 应用</h3>
        <bk-weweb
          id="angular-app"
          url="http://localhost:8003/"
          :scope-js="true"
          :scope-css="true"
        />
      </div>

      <!-- 原生 JS 应用 -->
      <div class="app-card">
        <h3>原生 JS 应用</h3>
        <bk-weweb
          id="vanilla-app"
          url="http://localhost:8004/"
          :scope-js="true"
          :scope-css="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.apps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
}

.app-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.app-card h3 {
  background: #f5f5f5;
  margin: 0;
  padding: 10px 15px;
  border-bottom: 1px solid #e8e8e8;
}
</style>
\`\`\`

## 注意事项

1. **JS 沙箱**：务必开启 \`scopeJs\`，防止不同框架的全局变量冲突
2. **CSS 隔离**：开启 \`scopeCss\` 防止样式污染
3. **资源共享**：相同的库可以通过 \`initSource\` 共享`,

  'error-handling': `# 错误处理示例

处理加载失败、超时等异常情况。

\`\`\`typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

async function loadMicroAppWithRetry(
  options: { url: string; id: string },
  maxRetries = 3,
  timeout = 10000
) {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // 创建超时 Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('加载超时')), timeout);
      });

      // 竞速
      await Promise.race([
        loadApp({
          url: options.url,
          id: options.id,
          scopeJs: true,
          scopeCss: true,
        }),
        timeoutPromise,
      ]);

      return true;  // 加载成功
    } catch (error) {
      lastError = error as Error;
      console.warn(\`加载失败，第 \${i + 1} 次重试...\`, error);

      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError;
}

// 使用
try {
  await loadMicroAppWithRetry({
    url: 'http://localhost:8001/',
    id: 'my-app',
  });

  mount('my-app', document.getElementById('container'));
} catch (error) {
  // 显示错误页面
  showErrorPage({
    message: '子应用加载失败',
    detail: error.message,
    retry: () => location.reload(),
  });
}
\`\`\`

## 全局错误监听

\`\`\`typescript
// 监听子应用的 JS 错误
window.addEventListener('error', (event) => {
  // 检查是否是子应用的错误
  const target = event.target as HTMLElement;
  if (target?.__BK_WEWEB_APP_KEY__) {
    console.error(\`子应用 \${target.__BK_WEWEB_APP_KEY__} 发生错误:\`, event.error);

    // 上报错误
    reportError({
      appId: target.__BK_WEWEB_APP_KEY__,
      error: event.error,
      message: event.message,
    });
  }
});

// 监听未处理的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 错误:', event.reason);
});
\`\`\``,
};

export function registerExampleTools(server: McpServer) {
  // 获取示例代码
  server.tool(
    'get_example_code',
    '获取 BK-WeWeb 各种使用场景的示例代码',
    {
      scenario: z
        .enum([
          'basic-app',
          'basic-module',
          'data-passing',
          'keep-alive',
          'preload',
          'shadow-dom',
          'scope-location',
          'custom-container',
          'multi-framework',
          'error-handling',
        ])
        .describe(
          '使用场景: basic-app(基础微应用), basic-module(基础微模块), data-passing(数据传递), keep-alive(缓存模式), preload(预加载), shadow-dom(Shadow DOM), scope-location(路由隔离), custom-container(自定义容器), multi-framework(多框架共存), error-handling(错误处理)',
        ),
    },
    async ({ scenario }) => {
      const example = EXAMPLES[scenario];
      if (!example) {
        return {
          content: [{ type: 'text', text: `未找到场景 "${scenario}" 的示例代码` }],
        };
      }
      return {
        content: [{ type: 'text', text: example }],
      };
    },
  );

  // 列出所有示例
  server.tool('list_examples', '列出所有可用的 BK-WeWeb 示例代码', {}, async () => {
    const scenarios = [
      { id: 'basic-app', name: '基础微应用', desc: '最简单的微应用接入方式' },
      { id: 'basic-module', name: '基础微模块', desc: '加载远程 JS 模块' },
      { id: 'data-passing', name: '数据传递', desc: '主应用向子应用传递数据' },
      { id: 'keep-alive', name: 'KeepAlive 缓存', desc: '多应用切换保持状态' },
      { id: 'preload', name: '预加载', desc: '利用空闲时间预加载资源' },
      { id: 'shadow-dom', name: 'Shadow DOM', desc: '深度样式隔离' },
      { id: 'scope-location', name: '路由隔离', desc: '子应用独立路由系统' },
      { id: 'custom-container', name: '自定义容器', desc: '完全控制加载和渲染' },
      { id: 'multi-framework', name: '多框架共存', desc: '集成不同技术栈的应用' },
      { id: 'error-handling', name: '错误处理', desc: '处理加载失败等异常' },
    ];

    const text = `# BK-WeWeb 示例代码

| 场景 | 说明 |
|------|------|
${scenarios.map(s => `| ${s.name} (\`${s.id}\`) | ${s.desc} |`).join('\n')}

使用 \`get_example_code\` 工具查看具体示例代码，例如：

\`\`\`
get_example_code({ scenario: 'basic-app' })
\`\`\``;

    return {
      content: [{ type: 'text', text }],
    };
  });
}
