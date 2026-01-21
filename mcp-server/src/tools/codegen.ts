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
 * 代码生成工具
 * 生成 BK-WeWeb 微应用/微模块的集成代码
 */

import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 配置选项 Schema
export const AppOptionsSchema = z.object({
  id: z.string().describe('应用唯一标识符'),
  url: z.string().url().describe('应用入口 URL'),
  scopeJs: z.boolean().default(true).describe('是否启用 JS 沙箱隔离'),
  scopeCss: z.boolean().default(true).describe('是否启用 CSS 样式隔离'),
  scopeLocation: z.boolean().default(false).describe('是否启用路由隔离'),
  setShadowDom: z.boolean().default(false).describe('是否使用 Shadow DOM'),
  keepAlive: z.boolean().default(false).describe('是否启用缓存模式'),
  data: z.record(z.string(), z.unknown()).optional().describe('传递给子应用的数据'),
});

export const ModuleOptionsSchema = z.object({
  id: z.string().describe('模块唯一标识符'),
  url: z.string().url().describe('模块入口 URL'),
  scopeJs: z.boolean().default(false).describe('是否启用 JS 沙箱隔离'),
  scopeCss: z.boolean().default(true).describe('是否启用 CSS 样式隔离'),
  keepAlive: z.boolean().default(false).describe('是否启用缓存模式'),
  data: z.record(z.string(), z.unknown()).optional().describe('传递给模块的数据'),
});

export function registerCodeGenTools(server: McpServer) {
  // 生成微应用代码
  server.tool(
    'generate_micro_app_code',
    '生成 BK-WeWeb 微应用的配置和使用代码',
    {
      id: z.string().describe('应用唯一标识符'),
      url: z.string().describe('应用入口 URL'),
      scopeJs: z.boolean().optional().describe('JS 沙箱隔离，默认 true'),
      scopeCss: z.boolean().optional().describe('CSS 样式隔离，默认 true'),
      scopeLocation: z.boolean().optional().describe('路由隔离，默认 false'),
      setShadowDom: z.boolean().optional().describe('Shadow DOM，默认 false'),
      keepAlive: z.boolean().optional().describe('缓存模式，默认 false'),
      data: z.string().optional().describe('传递给子应用的数据（JSON 字符串）'),
    },
    async params => {
      const {
        id,
        url,
        scopeJs = true,
        scopeCss = true,
        scopeLocation = false,
        setShadowDom = false,
        keepAlive = false,
        data,
      } = params;

      const dataObj = data ? JSON.parse(data) : undefined;

      // Web Component 方式
      const webComponentCode = `<!-- Web Component 方式 -->
<bk-weweb
  id="${id}"
  url="${url}"
  :scope-js="${scopeJs}"
  :scope-css="${scopeCss}"
  :scope-location="${scopeLocation}"
  :set-shadow-dom="${setShadowDom}"
  :keep-alive="${keepAlive}"${dataObj ? `\n  :data="JSON.stringify(${JSON.stringify(dataObj)})"` : ''}
/>`;

      // Hooks 方式
      const hooksCode = `// Hooks 方式
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载应用
await loadApp({
  url: '${url}',
  id: '${id}',
  scopeJs: ${scopeJs},
  scopeCss: ${scopeCss},
  scopeLocation: ${scopeLocation},
  setShadowDom: ${setShadowDom},
  keepAlive: ${keepAlive},${dataObj ? `\n  data: ${JSON.stringify(dataObj, null, 2).replace(/\n/g, '\n  ')},` : ''}
});

// 挂载到容器
mount('${id}', document.getElementById('container'));

// 卸载应用
unmount('${id}');`;

      // keepAlive 模式
      const keepAliveCode = keepAlive
        ? `

// KeepAlive 模式（使用 activated/deactivated）
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

await loadApp({
  url: '${url}',
  id: '${id}',
  keepAlive: true,
});

// 激活应用（显示）
activated('${id}', document.getElementById('container'));

// 停用应用（隐藏，保留状态）
deactivated('${id}');`
        : '';

      const result = `# 微应用代码生成结果

## 配置信息

- **ID**: ${id}
- **URL**: ${url}
- **JS 沙箱**: ${scopeJs}
- **CSS 隔离**: ${scopeCss}
- **路由隔离**: ${scopeLocation}
- **Shadow DOM**: ${setShadowDom}
- **缓存模式**: ${keepAlive}

## 方式一：Web Component

\`\`\`vue
${webComponentCode}
\`\`\`

## 方式二：Hooks API

\`\`\`typescript
${hooksCode}
\`\`\`
${keepAliveCode}`;

      return {
        content: [{ type: 'text', text: result }],
      };
    },
  );

  // 生成微模块代码
  server.tool(
    'generate_micro_module_code',
    '生成 BK-WeWeb 微模块的配置和使用代码',
    {
      id: z.string().describe('模块唯一标识符'),
      url: z.string().describe('模块入口 URL'),
      scopeJs: z.boolean().optional().describe('JS 沙箱隔离，默认 false'),
      scopeCss: z.boolean().optional().describe('CSS 样式隔离，默认 true'),
      keepAlive: z.boolean().optional().describe('缓存模式，默认 false'),
      data: z.string().optional().describe('传递给模块的数据（JSON 字符串）'),
    },
    async params => {
      const { id, url, scopeJs = false, scopeCss = true, keepAlive = false, data } = params;

      const dataObj = data ? JSON.parse(data) : undefined;

      // Web Component 方式
      const webComponentCode = `<!-- Web Component 方式 -->
<bk-weweb
  id="${id}"
  mode="js"
  url="${url}"
  :scope-js="${scopeJs}"
  :scope-css="${scopeCss}"
  :keep-alive="${keepAlive}"${dataObj ? `\n  :data="JSON.stringify(${JSON.stringify(dataObj)})"` : ''}
/>`;

      // Hooks 方式
      const hooksCode = `// Hooks 方式
import { loadInstance, activated, deactivated } from '@blueking/bk-weweb';

const container = document.getElementById('container');

// 加载模块
await loadInstance({
  url: '${url}',
  id: '${id}',
  mode: 'js',
  container,
  scopeJs: ${scopeJs},
  scopeCss: ${scopeCss},
  keepAlive: ${keepAlive},${dataObj ? `\n  data: ${JSON.stringify(dataObj, null, 2).replace(/\n/g, '\n  ')},` : ''}
});

// 激活模块
activated('${id}', container, (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);
});

// 停用模块
deactivated('${id}');`;

      // 模块导出规范
      const moduleExportCode = `// 模块导出规范 (${url})
export default {
  /**
   * 渲染模块
   * @param container 挂载容器
   * @param data 传递的数据
   */
  render(container: HTMLElement, data: Record<string, unknown>) {
    container.innerHTML = '<div class="my-module">模块内容</div>';
  },

  /**
   * 更新模块
   * @param data 新数据
   */
  update(data: Record<string, unknown>) {
    // 更新逻辑
  },

  /**
   * 销毁模块
   */
  destroy() {
    // 清理逻辑
  }
};`;

      const result = `# 微模块代码生成结果

## 配置信息

- **ID**: ${id}
- **URL**: ${url}
- **Mode**: js
- **JS 沙箱**: ${scopeJs}
- **CSS 隔离**: ${scopeCss}
- **缓存模式**: ${keepAlive}

## 方式一：Web Component

\`\`\`vue
${webComponentCode}
\`\`\`

## 方式二：Hooks API

\`\`\`typescript
${hooksCode}
\`\`\`

## 模块导出规范

\`\`\`typescript
${moduleExportCode}
\`\`\``;

      return {
        content: [{ type: 'text', text: result }],
      };
    },
  );

  // 生成 Vue 3 集成代码
  server.tool(
    'generate_vue_integration',
    '生成 Vue 3 集成 BK-WeWeb 的完整代码',
    {
      mode: z.enum(['app', 'module']).describe('模式: app(微应用) 或 module(微模块)'),
      id: z.string().describe('应用/模块标识符'),
      url: z.string().describe('入口 URL'),
      keepAlive: z.boolean().optional().describe('是否启用缓存模式'),
      useComposable: z.boolean().optional().describe('是否生成 Composable 函数'),
    },
    async ({ mode, id, url, keepAlive = false, useComposable = false }) => {
      let code = '';

      if (mode === 'app') {
        if (useComposable) {
          code = `// composables/useMicroApp.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { loadApp, mount, unmount, activated, deactivated, type IAppModelProps } from '@blueking/bk-weweb';

export function useMicroApp(
  options: IAppModelProps,
  containerRef: Ref<HTMLElement | null>
) {
  const loading = ref(true);
  const error = ref<Error | null>(null);

  onMounted(async () => {
    try {
      await loadApp(options);
      if (containerRef.value) {
        ${keepAlive ? 'activated(options.id!, containerRef.value);' : 'mount(options.id!, containerRef.value);'}
      }
      loading.value = false;
    } catch (e) {
      error.value = e as Error;
      loading.value = false;
    }
  });

  onBeforeUnmount(() => {
    if (options.id) {
      ${keepAlive ? 'deactivated(options.id);' : 'unmount(options.id);'}
    }
  });

  return { loading, error };
}

// 使用示例
// MicroAppContainer.vue
<template>
  <div class="micro-app-container">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error.message }}</div>
    <div ref="containerRef" class="app-wrapper"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMicroApp } from './composables/useMicroApp';

const containerRef = ref<HTMLElement | null>(null);
const { loading, error } = useMicroApp(
  {
    url: '${url}',
    id: '${id}',
    scopeJs: true,
    scopeCss: true,
    keepAlive: ${keepAlive},
  },
  containerRef
);
</script>`;
        } else {
          code = `<template>
  <div class="micro-app-container">
    <div ref="containerRef" class="app-wrapper"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { loadApp, ${keepAlive ? 'activated, deactivated' : 'mount, unmount'} } from '@blueking/bk-weweb';

const containerRef = ref<HTMLElement | null>(null);
const appId = '${id}';

onMounted(async () => {
  await loadApp({
    url: '${url}',
    id: appId,
    scopeJs: true,
    scopeCss: true,
    keepAlive: ${keepAlive},
  });

  if (containerRef.value) {
    ${keepAlive ? 'activated(appId, containerRef.value);' : 'mount(appId, containerRef.value);'}
  }
});

onBeforeUnmount(() => {
  ${keepAlive ? 'deactivated(appId);' : 'unmount(appId);'}
});
</script>

<style scoped>
.micro-app-container {
  width: 100%;
  height: 100%;
}

.app-wrapper {
  width: 100%;
  min-height: 400px;
}
</style>`;
        }
      } else {
        // module mode
        code = `<template>
  <div class="micro-module-container">
    <div ref="containerRef" class="module-wrapper"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { loadInstance, activated, deactivated } from '@blueking/bk-weweb';

const containerRef = ref<HTMLElement | null>(null);
const moduleId = '${id}';

onMounted(async () => {
  await loadInstance({
    url: '${url}',
    id: moduleId,
    mode: 'js',
    container: containerRef.value!,
    scopeJs: true,
    scopeCss: true,
    keepAlive: ${keepAlive},
  });

  activated(moduleId, containerRef.value!, (instance, exportInstance) => {
    console.log('模块已激活', exportInstance);
  });
});

onBeforeUnmount(() => {
  deactivated(moduleId);
});
</script>

<style scoped>
.micro-module-container {
  width: 100%;
}

.module-wrapper {
  width: 100%;
  min-height: 200px;
}
</style>`;
      }

      const result = `# Vue 3 集成代码

## 模式: ${mode === 'app' ? '微应用' : '微模块'}
## ID: ${id}
## URL: ${url}
## KeepAlive: ${keepAlive}

\`\`\`vue
${code}
\`\`\``;

      return {
        content: [{ type: 'text', text: result }],
      };
    },
  );

  // 生成 React 集成代码
  server.tool(
    'generate_react_integration',
    '生成 React 集成 BK-WeWeb 的完整代码',
    {
      mode: z.enum(['app', 'module']).describe('模式: app(微应用) 或 module(微模块)'),
      id: z.string().describe('应用/模块标识符'),
      url: z.string().describe('入口 URL'),
      keepAlive: z.boolean().optional().describe('是否启用缓存模式'),
      useCustomHook: z.boolean().optional().describe('是否生成自定义 Hook'),
    },
    async ({ mode, id, url, keepAlive = false, useCustomHook = false }) => {
      let code = '';

      if (mode === 'app') {
        if (useCustomHook) {
          code = `// hooks/useMicroApp.ts
import { useRef, useEffect, useState } from 'react';
import { loadApp, mount, unmount, activated, deactivated, type IAppModelProps } from '@blueking/bk-weweb';

export function useMicroApp(options: IAppModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMicroApp = async () => {
      try {
        await loadApp(options);
        if (containerRef.current) {
          ${keepAlive ? 'activated(options.id!, containerRef.current);' : 'mount(options.id!, containerRef.current);'}
        }
        setLoading(false);
      } catch (e) {
        setError(e as Error);
        setLoading(false);
      }
    };

    loadMicroApp();

    return () => {
      if (options.id) {
        ${keepAlive ? 'deactivated(options.id);' : 'unmount(options.id);'}
      }
    };
  }, [options.url, options.id]);

  return { containerRef, loading, error };
}

// 使用示例
// MicroAppContainer.tsx
import React from 'react';
import { useMicroApp } from './hooks/useMicroApp';

const MicroAppContainer: React.FC = () => {
  const { containerRef, loading, error } = useMicroApp({
    url: '${url}',
    id: '${id}',
    scopeJs: true,
    scopeCss: true,
    keepAlive: ${keepAlive},
  });

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">{error.message}</div>;

  return (
    <div className="micro-app-container">
      <div ref={containerRef} className="app-wrapper" />
    </div>
  );
};

export default MicroAppContainer;`;
        } else {
          code = `import React, { useRef, useEffect } from 'react';
import { loadApp, ${keepAlive ? 'activated, deactivated' : 'mount, unmount'} } from '@blueking/bk-weweb';

const MicroAppContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appId = '${id}';

  useEffect(() => {
    const loadMicroApp = async () => {
      await loadApp({
        url: '${url}',
        id: appId,
        scopeJs: true,
        scopeCss: true,
        keepAlive: ${keepAlive},
      });

      if (containerRef.current) {
        ${keepAlive ? 'activated(appId, containerRef.current);' : 'mount(appId, containerRef.current);'}
      }
    };

    loadMicroApp();

    return () => {
      ${keepAlive ? 'deactivated(appId);' : 'unmount(appId);'}
    };
  }, []);

  return (
    <div className="micro-app-container">
      <div
        ref={containerRef}
        style={{ width: '100%', minHeight: '400px' }}
      />
    </div>
  );
};

export default MicroAppContainer;`;
        }
      } else {
        // module mode
        code = `import React, { useRef, useEffect } from 'react';
import { loadInstance, activated, deactivated } from '@blueking/bk-weweb';

interface ModuleExport {
  render: (container: HTMLElement, data: Record<string, unknown>) => void;
  update: (data: Record<string, unknown>) => void;
  destroy: () => void;
}

const MicroModuleContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleId = '${id}';

  useEffect(() => {
    const loadModule = async () => {
      await loadInstance({
        url: '${url}',
        id: moduleId,
        mode: 'js',
        container: containerRef.current!,
        scopeJs: true,
        scopeCss: true,
        keepAlive: ${keepAlive},
      });

      activated<ModuleExport>(moduleId, containerRef.current!, (instance, exportInstance) => {
        console.log('模块已激活', exportInstance);
      });
    };

    loadModule();

    return () => {
      deactivated(moduleId);
    };
  }, []);

  return (
    <div className="micro-module-container">
      <div
        ref={containerRef}
        style={{ width: '100%', minHeight: '200px' }}
      />
    </div>
  );
};

export default MicroModuleContainer;`;
      }

      const result = `# React 集成代码

## 模式: ${mode === 'app' ? '微应用' : '微模块'}
## ID: ${id}
## URL: ${url}
## KeepAlive: ${keepAlive}

\`\`\`tsx
${code}
\`\`\``;

      return {
        content: [{ type: 'text', text: result }],
      };
    },
  );
}
