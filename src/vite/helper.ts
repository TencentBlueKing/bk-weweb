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

import type { Plugin } from 'vite';

const viteGlobalInjectKeys = [
  'window',
  'globalThis',
  'self',
  'document',
  'location',
  'process',
  '__VUE_OPTIONS_API__',
  '__BK_WEWEB_APP_KEY__',
  '__BK_WEWEB_DATA__',
  '__POWERED_BY_BK_WEWEB__',
  '__VUE_DEVTOOLS_HOOK_REPLAY__',
  '__VUE_DEVTOOLS_PLUGINS__',
  '__VUE_HMR_RUNTIME__',
  '__VUE_INSTANCE_SETTERS__',
  '__VUE_PROD_DEVTOOLS__',
  '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__',
  '__VUE__',
  '__bkui_vue_version__',
];

export interface WewebVitePluginOptions {
  injectWindowKeys?: string[];
  appKey: string;
}
export default function wewebVitePlugin(options: WewebVitePluginOptions): Plugin<{
  version: string;
}> {
  if (!options.appKey) {
    throw new Error('【bk-weweb】wewebVitePlugin appKey is required');
  }
  const injectCode = [...viteGlobalInjectKeys, ...(options.injectWindowKeys || [])]
    .flat()
    .map(key => `var ${key} = top?.['${options.appKey}']?.${key} || top?.${key};`)
    .join('');
  const version = '1.0.0';
  return {
    name: 'weweb-vite-plugin',
    apply: 'serve',
    enforce: 'post',
    transform(code, id) {
      if (process.env.NODE_ENV === 'development' && id.match(/\.(js|ts|jsx|tsx|mjs|vue|css)/)) {
        const newCode = code;
        // // vite 对应.css 文件的特殊处理
        // if (id.includes('vite/dist/client/client.mjs')) {
        //   newCode = code.replace(
        //     'const sheetsMap = new Map();',
        //     `const sheetsMap = new Map(); window.__sheetsMap__ = sheetsMap; console.info(sheetsMap, '=================')`,
        //   );
        // }
        return {
          code: `
          ${injectCode}
          ${newCode}
          `,
        };
      }
      return code;
    },
    version,
  };
}
