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
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const eslintVueParser = require('vue-eslint-parser');
const eslintVuePlugin = require('eslint-plugin-vue');
const OFF = 0;
// const WARNING = 1;
// const ERROR = 2;
module.exports = [
  ...require('@blueking/bkui-lint/eslint'),
  {
    rules: {
      'vue/multi-word-component-names': OFF,
      'vue/no-reserved-component-names': OFF,
      '@typescript-eslint/no-require-imports': OFF,
      '@typescript-eslint/no-var-requires': OFF,
      'perfectionist/sort-classes': OFF,
    },
  },
  {
    files: ['examples/vue3/**/*.vue', 'examples/main/**/*.vue'],
    languageOptions: {
      parser: eslintVueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        extraFileExtensions: ['.vue'],
        parser: '@typescript-eslint/parser',
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      vue: eslintVuePlugin,
    },
    rules: {
      ...eslintVuePlugin.configs['vue3-recommended'].rules,
      '@typescript-eslint/explicit-member-accessibility': OFF,
      '@typescript-eslint/indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    files: ['examples/vue2/**/*.vue', 'examples/instance/**/*.vue'],
    languageOptions: {
      parser: eslintVueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        extraFileExtensions: ['.vue'],
        parser: '@typescript-eslint/parser',
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      vue: eslintVuePlugin,
    },
    rules: {
      ...eslintVuePlugin.configs.recommended.rules,
      '@typescript-eslint/explicit-member-accessibility': OFF,
      '@typescript-eslint/indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    ignores: ['**/node_modules', '**/lib', '**/dist', '**/typings'],
  },
];
