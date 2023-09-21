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
const vueRules = require('./vue-rules.cjs');

function createEslint(tsconfigDir) {
  return  {
    env: {
      browser: true,
      es6: true,
      node: true
    },
    extends: [
      'eslint-config-tencent',
      'plugin:perfectionist/recommended-natural'
    ],
    globals: {
      NODE_ENV: true
    },
    overrides: [
      {
        extends: ['eslint-config-tencent/ts', 'plugin:vue/vue3-recommended'],
        files: ['examples/vue3/**/*.vue'],
        parser: 'vue-eslint-parser',
        parserOptions: {
          ecmaFeatures: {
            jsx: true
          },
          ecmaVersion: 2018,
          extraFileExtensions: ['.vue'],
          parser: '@typescript-eslint/parser',
          project: './tsconfig.eslint.json',
          sourceType: 'module',
          tsconfigRootDir: tsconfigDir
        },
        rules: {
          ...vueRules
        }
      },
      {
        extends: ['eslint-config-tencent/ts', 'plugin:vue/recommended'],
        files: ['examples/vue2/**/*.vue', 'examples/instance/**/*.vue'],
        parser: 'vue-eslint-parser',
        parserOptions: {
          ecmaFeatures: {
            jsx: true
          },
          ecmaVersion: 2018,
          extraFileExtensions: ['.vue'],
          parser: '@typescript-eslint/parser',
          project: './tsconfig.eslint.json',
          sourceType: 'module',
          tsconfigRootDir: tsconfigDir
        },
        rules: {
          ...vueRules
        }
      },
      {
        extends: ['eslint-config-tencent/ts', 'plugin:prettier/recommended'],
        files: ['*.ts', '*.tsx'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2018,
          project: './tsconfig.eslint.json',
          sourceType: 'module',
          tsconfigRootDir: tsconfigDir
        },
        rules: {
          '@typescript-eslint/indent': 'off',
          '@typescript-eslint/member-ordering': 'off',
          '@typescript-eslint/no-misused-promises': [
            'error',
            {
              checksSpreads: false,
              checksVoidReturn: false,
              checksVoidReturn: false
            }
          ],
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
              pattern: '.*Tencent is pleased to support the open source community.+'
            }
          ],
          indent: 'off',
          'prettier/prettier': 'error'
        }
      },
      {
        extends: ['plugin:prettier/recommended'],
        files: ['*.js', 'scripts/*.js'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          project: './tsconfig.eslint.json',
          tsconfigRootDir: tsconfigDir
        },
        rules: {
          '@typescript-eslint/no-misused-promises': [
            'error',
            {
              checksSpreads: false,
              checksVoidReturn: false,
              checksVoidReturn: false
            }
          ],
          'max-len': [
            'error',
            {
              code: 120,
              ignoreRegExpLiterals: true,
              ignoreStrings: true,
              ignoreTemplateLiterals: true,
              ignoreUrls: true
            }
          ],
          'prettier/prettier': 'error'
        }
      }
    ],
    plugins: ['vue', 'prettier', 'codecc', 'perfectionist'],
    root: true,
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'arrow-body-style': 'off',
      'codecc/comment-ratio': ['error', 10],
      'comma-dangle': ['error', 'never'],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'prefer-arrow-callback': 'off'
    }
  };
}
module.exports = {
  createEslint
};
