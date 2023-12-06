const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const eslintConfigPrettier = require('eslint-config-prettier');
const prettier = require('eslint-plugin-prettier');
const typescriptEslintParser = require('@typescript-eslint/parser');
const codecc = require('eslint-plugin-codecc');
const eslintVueParser = require('vue-eslint-parser');
const perfectionistNatural = require('eslint-plugin-perfectionist/configs/recommended-natural');
const vueRules = require('./vue-rules.cjs');
const eslintVuePlugin = require('eslint-plugin-vue');

module.exports = [
  eslintConfigPrettier,
  perfectionistNatural,
  {
    // files: ['./**/*.js', './**/*.ts', './**/*.cjs'],
    // ignores: ['examples/**/*.vue'],
    plugins: {
      prettier,
    },
    rules: {
      ...prettier.configs.recommended.rules,
    },
  },
  {
    files: ['src/**/*.ts', 'examples/**/*.ts'],
    ignores: [],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2018,
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    linterOptions: {},
    plugins: {
      '@typescript-eslint': typescriptEslint,
      codecc,
    },
    rules: {
      'codecc/license': [
        'error',
        {
          license: `/*
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
*/\n`,
          pattern: '.*Tencent is pleased to support the open source community.+',
        },
      ],
    },
    settings: {},
  },
  {
    files: ['examples/vue3/**/*.vue'],
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
      ...vueRules,
      '@typescript-eslint/explicit-member-accessibility': 'off',
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
      ...eslintVuePlugin.configs['recommended'].rules,
      ...vueRules,
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
];
