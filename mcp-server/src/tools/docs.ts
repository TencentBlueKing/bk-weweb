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
 * 文档查询工具
 * 提供 BK-WeWeb 文档查询功能
 */

import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 文档数据
const DOCS_DATA: Record<string, string> = {
  introduction: `# BK-WeWeb 简介

BK-WeWeb 是由腾讯蓝鲸团队开源的一款**轻量级微前端框架**。它基于 Web Components 技术，提供了完善的应用隔离机制。

## 核心理念

### 零侵入
子应用无需任何改造即可接入，不需要修改构建配置、不需要暴露生命周期钩子。

### 双模式
- **微应用模式**: 加载完整的远程应用（HTML Entry）
- **微模块模式**: 加载远程 JS 模块

### 完善隔离
- **JS 沙箱**: 基于 Proxy 实现，防止全局变量污染
- **CSS 作用域**: 自动添加样式前缀，防止样式冲突
- **路由隔离**: 可选的独立 Location/History`,

  'quick-start': `# 快速上手

## 安装

\`\`\`bash
npm install @blueking/bk-weweb
\`\`\`

## 基础使用

### 1. 引入

\`\`\`typescript
import '@blueking/bk-weweb';
\`\`\`

### 2. 使用 Web Component

\`\`\`html
<!-- 微应用 -->
<bk-weweb id="my-app" url="http://localhost:8001/" />

<!-- 微模块 -->
<bk-weweb id="my-module" mode="js" url="http://localhost:8002/widget.js" />
\`\`\`

### 3. 使用 Hooks API

\`\`\`typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
});

// 挂载
mount('my-app', document.getElementById('container'));

// 卸载
unmount('my-app');
\`\`\``,

  'micro-app': `# 微应用模式

微应用模式用于加载**独立部署的远程应用**。

## 配置属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | string | - | 应用唯一标识符 |
| url | string | - | 应用入口 URL（必填）|
| scopeJs | boolean | true | JS 沙箱隔离 |
| scopeCss | boolean | true | CSS 样式隔离 |
| scopeLocation | boolean | false | 路由隔离 |
| setShadowDom | boolean | false | Shadow DOM 模式 |
| keepAlive | boolean | false | 缓存模式 |
| data | object | - | 传递给子应用的数据 |

## 示例

\`\`\`typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
  keepAlive: true,
  data: { userId: '123', token: 'xxx' }
});
\`\`\``,

  'micro-module': `# 微模块模式

微模块模式用于加载**远程 JS 模块**，适合插件、组件等场景。

## 配置属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | string | - | 模块唯一标识符 |
| url | string | - | 模块入口 URL（必填）|
| mode | 'js' | - | 必须设置为 'js' |
| scopeJs | boolean | false | JS 沙箱隔离 |
| scopeCss | boolean | true | CSS 样式隔离 |
| keepAlive | boolean | false | 缓存模式 |
| data | object | - | 传递给模块的数据 |

## 模块导出规范

\`\`\`typescript
// widget.js
export default {
  render(container, data) {
    container.innerHTML = '<div>Widget Content</div>';
  },
  update(data) {
    // 更新逻辑
  },
  destroy() {
    // 销毁逻辑
  }
};
\`\`\``,

  hooks: `# Hooks API

BK-WeWeb 提供了一套完整的 Hooks API。

## 加载类

| Hook | 说明 | 返回值 |
|------|------|--------|
| load(props) | 统一加载入口 | Promise<BaseModel> |
| loadApp(props) | 加载微应用 | Promise<MicroAppModel> |
| loadInstance(props) | 加载微模块 | Promise<MicroInstanceModel> |

## 生命周期类

| Hook | 说明 |
|------|------|
| mount(appKey, container?, callback?) | 挂载应用 |
| unmount(appKey) | 卸载应用 |
| activated(appKey, container, callback?) | 激活应用 |
| deactivated(appKey) | 停用应用 |
| unload(url) | 删除缓存 |

## 预加载类

| Hook | 说明 |
|------|------|
| preLoadApp(options) | 预加载微应用 |
| preLoadInstance(options) | 预加载微模块 |
| preLoadSource(sourceList) | 预加载资源 |`,

  api: `# API 参考

## WeWeb 类

\`\`\`typescript
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true,  // 收集基础资源
  webComponentTag: 'my-app', // 自定义标签名
  fetchSource: async (url, options) => { // 自定义请求
    const response = await fetch(url, options);
    return response.text();
  }
});
\`\`\`

## 类型定义

\`\`\`typescript
interface IAppModelProps {
  url: string;
  id?: string;
  scopeJs?: boolean;
  scopeCss?: boolean;
  scopeLocation?: boolean;
  setShadowDom?: boolean;
  keepAlive?: boolean;
  showSourceCode?: boolean;
  data?: Record<string, unknown>;
  initSource?: string[];
}

interface IJsModelProps {
  url: string;
  id?: string;
  mode: 'js';
  scopeJs?: boolean;
  scopeCss?: boolean;
  keepAlive?: boolean;
  data?: Record<string, unknown>;
}
\`\`\`

## 全局变量（子应用中可用）

| 变量 | 类型 | 说明 |
|------|------|------|
| window.__POWERED_BY_BK_WEWEB__ | boolean | 是否在 bk-weweb 环境 |
| window.__BK_WEWEB_APP_KEY__ | string | 应用标识符 |
| window.__BK_WEWEB_DATA__ | object | 主应用传递的数据 |
| window.rawWindow | Window | 原始 window 对象 |
| window.rawDocument | Document | 原始 document 对象 |`,

  preload: `# 预加载

利用浏览器空闲时间预加载资源，提升应用加载速度。

## 预加载微应用

\`\`\`typescript
import { preLoadApp } from '@blueking/bk-weweb';

preLoadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  scopeJs: true,
  scopeCss: true,
});
\`\`\`

## 预加载微模块

\`\`\`typescript
import { preLoadInstance } from '@blueking/bk-weweb';

preLoadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: 'js',
});
\`\`\`

## 预加载资源

\`\`\`typescript
import { preLoadSource } from '@blueking/bk-weweb';

preLoadSource([
  'https://cdn.example.com/vue.min.js',
  'https://cdn.example.com/common.css',
]);
\`\`\``,

  'shadow-dom': `# Shadow DOM 模式

使用 Shadow DOM 获得更彻底的样式隔离。

## 启用方式

\`\`\`html
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :set-shadow-dom="true"
/>
\`\`\`

\`\`\`typescript
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  setShadowDom: true,
});
\`\`\`

## 优缺点

### 优点
- 完全隔离的 DOM 作用域
- CSS 样式完全隔离
- 不受外部样式影响

### 缺点
- 某些第三方库可能不兼容
- 弹窗等组件可能需要特殊处理`,

  'keep-alive': `# KeepAlive 缓存模式

保留应用状态，切换时不销毁 DOM。

## 启用方式

\`\`\`html
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
  :keep-alive="true"
/>
\`\`\`

## 生命周期

启用 keepAlive 后，使用 activated/deactivated 代替 mount/unmount：

\`\`\`typescript
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
  keepAlive: true,
});

// 激活（显示）
activated('my-app', container);

// 停用（隐藏，保留状态）
deactivated('my-app');

// 再次激活，状态保留
activated('my-app', container);
\`\`\``,
};

// API 参考数据
const API_DATA: Record<string, string> = {
  loadApp: `# loadApp

加载微应用。

## 函数签名

\`\`\`typescript
function loadApp(props: IAppModelProps): Promise<MicroAppModel>
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 应用入口 URL |
| id | string | 否 | 应用唯一标识 |
| scopeJs | boolean | 否 | JS 沙箱隔离，默认 true |
| scopeCss | boolean | 否 | CSS 样式隔离，默认 true |
| scopeLocation | boolean | 否 | 路由隔离，默认 false |
| setShadowDom | boolean | 否 | Shadow DOM，默认 false |
| keepAlive | boolean | 否 | 缓存模式，默认 false |
| data | object | 否 | 传递给子应用的数据 |
| initSource | string[] | 否 | 初始化资源列表 |

## 示例

\`\`\`typescript
import { loadApp } from '@blueking/bk-weweb';

const app = await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' }
});
\`\`\``,

  loadInstance: `# loadInstance

加载微模块。

## 函数签名

\`\`\`typescript
function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel>
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 模块入口 URL |
| id | string | 否 | 模块唯一标识 |
| container | Element | 否 | 挂载容器 |
| scopeJs | boolean | 否 | JS 沙箱隔离，默认 false |
| scopeCss | boolean | 否 | CSS 样式隔离，默认 true |
| keepAlive | boolean | 否 | 缓存模式，默认 false |
| data | object | 否 | 传递给模块的数据 |

## 示例

\`\`\`typescript
import { loadInstance } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart-widget',
  container: document.getElementById('container'),
  scopeJs: true,
  data: { type: 'bar' }
});
\`\`\``,

  mount: `# mount

将已加载的应用挂载到容器。

## 函数签名

\`\`\`typescript
function mount<T>(
  appKey: string,
  container?: Element,
  callback?: (instance: BaseModel, exportInstance?: T) => void
): void
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | string | 是 | 应用标识符（id） |
| container | Element | 否 | 挂载容器 |
| callback | Function | 否 | 挂载完成回调 |

## 示例

\`\`\`typescript
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({ url: '...', id: 'my-app' });

mount('my-app', document.getElementById('container'), (instance) => {
  console.log('挂载完成', instance);
});
\`\`\``,

  unmount: `# unmount

卸载应用。

## 函数签名

\`\`\`typescript
function unmount(appKey: string): void
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | string | 是 | 应用标识符（id） |

## 示例

\`\`\`typescript
import { unmount } from '@blueking/bk-weweb';

unmount('my-app');
\`\`\``,

  activated: `# activated

激活应用（用于 keepAlive 模式）。

## 函数签名

\`\`\`typescript
function activated<T>(
  appKey: string,
  container: Element,
  callback?: (instance: BaseModel, exportInstance?: T) => void
): void
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | string | 是 | 应用标识符 |
| container | Element | 是 | 挂载容器 |
| callback | Function | 否 | 激活完成回调 |

## 示例

\`\`\`typescript
import { loadInstance, activated } from '@blueking/bk-weweb';

await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  keepAlive: true,
});

activated('my-module', container, (instance, exportInstance) => {
  console.log('模块已激活', exportInstance);
});
\`\`\``,

  deactivated: `# deactivated

停用应用（用于 keepAlive 模式）。

## 函数签名

\`\`\`typescript
function deactivated(appKey: string): void
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appKey | string | 是 | 应用标识符 |

## 示例

\`\`\`typescript
import { deactivated } from '@blueking/bk-weweb';

deactivated('my-module');
\`\`\``,

  unload: `# unload

删除应用缓存。

## 函数签名

\`\`\`typescript
function unload(url: string): void
\`\`\`

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 应用/模块的 URL |

## 示例

\`\`\`typescript
import { unload } from '@blueking/bk-weweb';

// 删除应用缓存，下次加载会重新请求资源
unload('http://localhost:8001/');
\`\`\``,

  preLoadApp: `# preLoadApp

预加载微应用资源。

## 函数签名

\`\`\`typescript
function preLoadApp(options: IAppModelProps): void
\`\`\`

## 示例

\`\`\`typescript
import { preLoadApp } from '@blueking/bk-weweb';

// 利用空闲时间预加载
preLoadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  scopeJs: true,
  scopeCss: true,
});
\`\`\``,

  preLoadInstance: `# preLoadInstance

预加载微模块资源。

## 函数签名

\`\`\`typescript
function preLoadInstance(options: IJsModelProps): void
\`\`\`

## 示例

\`\`\`typescript
import { preLoadInstance } from '@blueking/bk-weweb';

preLoadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'chart-widget',
});
\`\`\``,
};

export function registerDocTools(server: McpServer) {
  // 获取文档工具
  server.tool(
    'get_bk_weweb_docs',
    '获取 BK-WeWeb 微前端框架的文档，支持按主题查询',
    {
      topic: z
        .enum([
          'introduction',
          'quick-start',
          'micro-app',
          'micro-module',
          'hooks',
          'api',
          'preload',
          'shadow-dom',
          'keep-alive',
        ])
        .describe(
          '文档主题: introduction(简介), quick-start(快速上手), micro-app(微应用), micro-module(微模块), hooks(Hooks API), api(API参考), preload(预加载), shadow-dom(Shadow DOM), keep-alive(缓存模式)',
        ),
    },
    async ({ topic }) => {
      const content = DOCS_DATA[topic];
      if (!content) {
        return {
          content: [{ type: 'text', text: `未找到主题 "${topic}" 的文档` }],
        };
      }
      return {
        content: [{ type: 'text', text: content }],
      };
    },
  );

  // 获取 API 参考工具
  server.tool(
    'get_api_reference',
    '获取 BK-WeWeb 特定 API 的详细参考文档',
    {
      api_name: z
        .enum([
          'loadApp',
          'loadInstance',
          'mount',
          'unmount',
          'activated',
          'deactivated',
          'unload',
          'preLoadApp',
          'preLoadInstance',
        ])
        .describe('API 名称'),
    },
    async ({ api_name }) => {
      const content = API_DATA[api_name];
      if (!content) {
        return {
          content: [{ type: 'text', text: `未找到 API "${api_name}" 的文档` }],
        };
      }
      return {
        content: [{ type: 'text', text: content }],
      };
    },
  );

  // 列出所有可用文档
  server.tool('list_bk_weweb_docs', '列出所有可用的 BK-WeWeb 文档主题', {}, async () => {
    const topics = [
      { topic: 'introduction', description: '简介 - 了解 BK-WeWeb 是什么' },
      { topic: 'quick-start', description: '快速上手 - 5 分钟快速接入指南' },
      { topic: 'micro-app', description: '微应用模式 - 加载完整远程应用' },
      { topic: 'micro-module', description: '微模块模式 - 加载远程 JS 模块' },
      { topic: 'hooks', description: 'Hooks API - 生命周期控制' },
      { topic: 'api', description: 'API 参考 - 完整 API 文档' },
      { topic: 'preload', description: '预加载 - 资源预加载策略' },
      { topic: 'shadow-dom', description: 'Shadow DOM - 彻底的样式隔离' },
      { topic: 'keep-alive', description: '缓存模式 - 保留应用状态' },
    ];

    const apis = [
      'loadApp',
      'loadInstance',
      'mount',
      'unmount',
      'activated',
      'deactivated',
      'unload',
      'preLoadApp',
      'preLoadInstance',
    ];

    const text = `# BK-WeWeb 文档目录

## 文档主题

${topics.map(t => `- **${t.topic}**: ${t.description}`).join('\n')}

## API 参考

${apis.map(a => `- ${a}`).join('\n')}

使用 \`get_bk_weweb_docs\` 查看特定主题文档
使用 \`get_api_reference\` 查看特定 API 文档`;

    return {
      content: [{ type: 'text', text }],
    };
  });
}
