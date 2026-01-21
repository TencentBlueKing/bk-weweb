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
 * 配置校验工具
 * 校验 BK-WeWeb 配置是否正确
 */

import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 微应用配置 Schema
const AppConfigSchema = z.object({
  url: z.string().min(1, 'url 是必填项'),
  id: z.string().optional(),
  mode: z.enum(['app', 'js', 'config']).optional(),
  scopeJs: z.boolean().optional(),
  scopeCss: z.boolean().optional(),
  scopeLocation: z.boolean().optional(),
  setShadowDom: z.boolean().optional(),
  keepAlive: z.boolean().optional(),
  showSourceCode: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  initSource: z.array(z.string()).optional(),
});

// 微模块配置 Schema
const ModuleConfigSchema = z.object({
  url: z.string().min(1, 'url 是必填项'),
  id: z.string().optional(),
  mode: z.literal('js'),
  container: z.any().optional(),
  scopeJs: z.boolean().optional(),
  scopeCss: z.boolean().optional(),
  keepAlive: z.boolean().optional(),
  showSourceCode: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  initSource: z.array(z.string()).optional(),
});

// 启动配置 Schema
const StartConfigSchema = z.object({
  collectBaseSource: z.boolean().optional(),
  fetchSource: z.any().optional(),
  webComponentTag: z
    .string()
    .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/, 'Web Component 标签名必须包含连字符，例如 my-app')
    .optional(),
});

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

function validateAppConfig(config: Record<string, unknown>): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // 基础验证
  const parseResult = AppConfigSchema.safeParse(config);
  if (!parseResult.success) {
    result.valid = false;
    result.errors = parseResult.error.issues.map(e => `${String(e.path.join('.'))}: ${e.message}`);
  }

  // URL 验证
  if (config.url) {
    const url = config.url as string;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      result.warnings.push('建议使用完整的 URL（包含协议）');
    }
    if (url.endsWith('/') === false && !url.includes('.html')) {
      result.suggestions.push('如果是 HTML Entry，建议 URL 以 / 结尾');
    }
  }

  // ID 验证
  if (!config.id) {
    result.warnings.push('建议设置 id 属性，便于管理和调试');
  } else {
    const id = config.id as string;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id)) {
      result.warnings.push('id 建议使用字母开头，只包含字母、数字、下划线和连字符');
    }
  }

  // 隔离配置检查
  if (config.scopeJs === false) {
    result.warnings.push('scopeJs=false 会禁用 JS 沙箱，可能导致全局变量污染');
  }

  if (config.scopeCss === false) {
    result.warnings.push('scopeCss=false 会禁用样式隔离，可能导致样式冲突');
  }

  // Shadow DOM 与 scopeLocation 冲突检查
  if (config.setShadowDom && config.scopeLocation) {
    result.suggestions.push('Shadow DOM 模式下通常不需要启用 scopeLocation');
  }

  // keepAlive 使用建议
  if (config.keepAlive) {
    result.suggestions.push('启用 keepAlive 后，请使用 activated/deactivated 代替 mount/unmount');
  }

  // data 验证
  if (config.data) {
    try {
      JSON.stringify(config.data);
    } catch {
      result.errors.push('data 必须是可序列化的对象');
      result.valid = false;
    }
  }

  return result;
}

function validateModuleConfig(config: Record<string, unknown>): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // 基础验证
  if (config.mode !== 'js') {
    result.errors.push('微模块的 mode 必须设置为 "js"');
    result.valid = false;
  }

  const parseResult = ModuleConfigSchema.safeParse(config);
  if (!parseResult.success) {
    result.valid = false;
    result.errors = parseResult.error.issues.map(e => `${String(e.path.join('.'))}: ${e.message}`);
  }

  // URL 验证
  if (config.url) {
    const url = config.url as string;
    if (!url.endsWith('.js') && !url.endsWith('.mjs')) {
      result.warnings.push('微模块的 URL 通常应该指向 .js 或 .mjs 文件');
    }
  }

  // ID 验证
  if (!config.id) {
    result.warnings.push('建议设置 id 属性');
  }

  // container 验证
  if (!config.container) {
    result.suggestions.push('建议在加载时指定 container，或在 activated 时传入');
  }

  return result;
}

function validateStartConfig(config: Record<string, unknown>): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  const parseResult = StartConfigSchema.safeParse(config);
  if (!parseResult.success) {
    result.valid = false;
    result.errors = parseResult.error.issues.map(e => `${String(e.path.join('.'))}: ${e.message}`);
  }

  // webComponentTag 验证
  if (config.webComponentTag) {
    const tag = config.webComponentTag as string;
    if (!tag.includes('-')) {
      result.errors.push('Web Component 标签名必须包含连字符（如 my-app）');
      result.valid = false;
    }
    if (tag.startsWith('-') || tag.endsWith('-')) {
      result.errors.push('标签名不能以连字符开头或结尾');
      result.valid = false;
    }
  }

  // fetchSource 验证
  if (config.fetchSource && typeof config.fetchSource !== 'function') {
    result.errors.push('fetchSource 必须是一个函数');
    result.valid = false;
  }

  // collectBaseSource 建议
  if (config.collectBaseSource) {
    result.suggestions.push('collectBaseSource 会收集主应用的资源用于共享，适合生产环境');
  }

  return result;
}

export function registerValidateTools(server: McpServer) {
  // 校验配置工具
  server.tool(
    'validate_weweb_config',
    '校验 BK-WeWeb 配置是否正确',
    {
      config: z.string().describe('配置对象的 JSON 字符串'),
      type: z.enum(['app', 'module', 'start']).describe('配置类型: app(微应用), module(微模块), start(启动配置)'),
    },
    async ({ config, type }) => {
      let configObj: Record<string, unknown>;
      try {
        configObj = JSON.parse(config);
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: '❌ 配置解析失败：无效的 JSON 格式',
            },
          ],
        };
      }

      let result: ValidationResult;
      switch (type) {
        case 'app':
          result = validateAppConfig(configObj);
          break;
        case 'module':
          result = validateModuleConfig(configObj);
          break;
        case 'start':
          result = validateStartConfig(configObj);
          break;
        default:
          return {
            content: [{ type: 'text', text: '❌ 未知的配置类型' }],
          };
      }

      const output = ['# 配置校验结果\n', `## 状态: ${result.valid ? '✅ 通过' : '❌ 失败'}\n`];

      if (result.errors.length > 0) {
        output.push('\n## ❌ 错误\n');
        result.errors.forEach(e => output.push(`- ${e}\n`));
      }

      if (result.warnings.length > 0) {
        output.push('\n## ⚠️ 警告\n');
        result.warnings.forEach(w => output.push(`- ${w}\n`));
      }

      if (result.suggestions.length > 0) {
        output.push('\n## 💡 建议\n');
        result.suggestions.forEach(s => output.push(`- ${s}\n`));
      }

      if (result.valid && result.warnings.length === 0 && result.suggestions.length === 0) {
        output.push('\n配置看起来没有问题！');
      }

      return {
        content: [{ type: 'text', text: output.join('') }],
      };
    },
  );

  // 检查兼容性工具
  server.tool('check_browser_compatibility', '检查 BK-WeWeb 的浏览器兼容性要求', {}, async () => {
    const text = `# BK-WeWeb 浏览器兼容性

## 必需的浏览器特性

| 特性 | 说明 |
|------|------|
| Web Components | Custom Elements v1 |
| ES6 Proxy | JS 沙箱实现 |
| Shadow DOM | 可选，用于深度隔离 |
| ES6+ | 模块化、Promise 等 |

## 最低版本要求

| 浏览器 | 最低版本 | 发布日期 |
|--------|----------|----------|
| Chrome | 67+ | 2018-05 |
| Firefox | 63+ | 2018-10 |
| Safari | 10.1+ | 2017-03 |
| Edge | 79+ | 2020-01 |

## 不支持的浏览器

- ❌ Internet Explorer (所有版本)
- ❌ Edge Legacy (EdgeHTML)

## 检测代码

\`\`\`javascript
function checkCompatibility() {
  const features = {
    customElements: 'customElements' in window,
    proxy: typeof Proxy !== 'undefined',
    shadowDOM: 'attachShadow' in Element.prototype,
    promise: typeof Promise !== 'undefined',
    fetch: typeof fetch !== 'undefined',
  };

  const allSupported = Object.values(features).every(Boolean);

  if (!allSupported) {
    console.warn('当前浏览器不完全支持 BK-WeWeb，缺少以下特性：',
      Object.entries(features)
        .filter(([, v]) => !v)
        .map(([k]) => k)
    );
  }

  return { supported: allSupported, features };
}
\`\`\``;

    return {
      content: [{ type: 'text', text }],
    };
  });

  // CORS 配置检查
  server.tool(
    'get_cors_config',
    '获取子应用 CORS 跨域配置指南',
    {
      mainAppOrigin: z.string().optional().describe('主应用的域名'),
    },
    async ({ mainAppOrigin }) => {
      const origin = mainAppOrigin || 'http://main-app.example.com';

      const text = `# 子应用 CORS 配置指南

主应用需要跨域获取子应用的 HTML、CSS、JS 资源，因此子应用服务器需要配置正确的 CORS 响应头。

## 必需的响应头

\`\`\`
Access-Control-Allow-Origin: ${origin}
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
\`\`\`

## Nginx 配置示例

\`\`\`nginx
server {
    listen 80;
    server_name child-app.example.com;

    location / {
        # CORS 配置
        add_header Access-Control-Allow-Origin "${origin}" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        # 处理 OPTIONS 预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "${origin}";
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
            add_header Content-Length 0;
            return 204;
        }

        # 静态资源配置
        root /var/www/child-app;
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`

## Express 配置示例

\`\`\`javascript
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '${origin}',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.static('dist'));
\`\`\`

## Vite 开发服务器配置

\`\`\`typescript
// vite.config.ts
export default defineConfig({
  server: {
    cors: {
      origin: '${origin}',
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  },
});
\`\`\`

## 常见问题

1. **响应头未生效**：确保 add_header 指令在正确的 location 块中
2. **预检请求失败**：需要单独处理 OPTIONS 请求
3. **凭证问题**：如需发送 Cookie，需添加 \`Access-Control-Allow-Credentials: true\``;

      return {
        content: [{ type: 'text', text }],
      };
    },
  );
}
