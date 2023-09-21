/* eslint-disable codecc/comment-ratio */
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
module.exports = {
  '@typescript-eslint/explicit-member-accessibility': 'off',
  '@typescript-eslint/indent': ['error', 2],
  'codecc/comment-ratio': 0,
  'comma-dangle': [
    'error',
    {
      arrays: 'always',
      exports: 'never',
      functions: 'never',
      imports: 'never',
      objects: 'never'
    }
  ],
  indent: 'off',
  'max-len': 'off',
  'new-cap': 'off',
  'no-param-reassign': [
    'warn',
    {
      props: false
    }
  ],
  'vue/array-bracket-spacing': ['error', 'never'],
  'vue/arrow-spacing': ['error', { after: true, before: true }],
  'vue/attribute-hyphenation': ['error', 'always'],
  'vue/attributes-order': 'off',
  'vue/block-spacing': ['error', 'always'],
  'vue/brace-style': ['error', '1tbs', { allowSingleLine: false }],
  'vue/camelcase': ['error', { ignoreDestructuring: true, properties: 'never' }],
  'vue/comma-dangle': [
    'error',
    {
      arrays: 'always',
      exports: 'never',
      functions: 'never',
      imports: 'never',
      objects: 'never'
    }
  ],
  'vue/comment-directive': 1,
  'vue/component-name-in-template-casing': [
    'error',
    'kebab-case',
    {
      ignores: [],
      registeredComponentsOnly: false
    }
  ],
  'vue/component-tags-order': [
    'error',
    {
      order: ['template', 'script', 'style']
    }
  ],
  'vue/eqeqeq': ['error', 'always', { null: 'ignore' }],
  'vue/html-closing-bracket-newline': [
    'error',
    {
      multiline: 'always',
      singleline: 'never'
    }
  ],
  'vue/html-closing-bracket-spacing': [
    'error',
    {
      endTag: 'never',
      selfClosingTag: 'always',
      startTag: 'never'
    }
  ],
  'vue/html-end-tags': 'error',
  'vue/html-indent': [
    'error',
    4,
    {
      alignAttributesVertically: true,
      attribute: 1,
      baseIndent: 1,
      closeBracket: 0,
      ignores: []
    }
  ],
  'vue/html-indent': [
    'error',
    2,
    {
      alignAttributesVertically: true,
      attribute: 1,
      baseIndent: 1,
      closeBracket: 0,
      ignores: []
    }
  ],
  'vue/html-quotes': ['error', 'double'],
  'vue/html-self-closing': [
    'error',
    {
      html: {
        component: 'always',
        normal: 'always',
        void: 'never'
      },
      math: 'always',
      svg: 'always'
    }
  ],
  'vue/jsx-uses-vars': 1,
  'vue/key-spacing': ['error', { afterColon: true, beforeColon: false }],
  'vue/match-component-file-name': 'off',
  'vue/max-attributes-per-line': [
    'error',
    {
      multiline: {
        max: 1
      },
      singleline: {
        max: 1
      }
    }
  ],
  'vue/max-len': [
    'error',
    {
      code: 120,
      comments: 8000,
      ignoreComments: true,
      ignoreHTMLAttributeValues: true,
      ignoreHTMLTextContents: true,
      ignorePattern: '',
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      tabWidth: 2,
      template: 8000
    }
  ],
  'vue/multi-word-component-names': 'off',
  'vue/multiline-html-element-content-newline': 'off',
  'vue/mustache-interpolation-spacing': 'off',
  'vue/name-property-casing': 'off',
  'vue/no-async-in-computed-properties': 'error',
  'vue/no-boolean-default': 'off',
  'vue/no-confusing-v-for-v-if': 'off',
  'vue/no-dupe-keys': 'error',
  'vue/no-duplicate-attributes': 'error',
  'vue/no-multi-spaces': 'error',
  'vue/no-mutating-props': 0,
  'vue/no-parsing-error': 'error',
  'vue/no-reserved-keys': 'error',
  'vue/no-restricted-syntax': 'off',
  'vue/no-setup-props-destructure': 'off',
  'vue/no-shared-component-data': 'error',
  'vue/no-side-effects-in-computed-properties': 'off',
  'vue/no-spaces-around-equal-signs-in-attribute': 'error',
  'vue/no-template-key': 'off',
  'vue/no-template-shadow': 'error',
  'vue/no-textarea-mustache': 'error',
  'vue/no-unused-components': 'error',
  'vue/no-unused-vars': 'error',
  'vue/no-use-v-if-with-v-for': 'off',
  'vue/no-v-html': 'error',
  'vue/object-curly-spacing': ['error', 'always'],
  'vue/order-in-components': [
    'error',
    {
      order: [
        'el',
        'name',
        'parent',
        'functional',
        ['delimiters', 'comments'],
        ['components', 'directives', 'filters'],
        'extends',
        'mixins',
        'inheritAttrs',
        'model',
        ['props', 'propsData'],
        'data',
        'computed',
        'watch',
        'LIFECYCLE_HOOKS',
        'methods',
        ['template', 'render'],
        'renderError'
      ]
    }
  ],
  'vue/prop-name-casing': ['error', 'camelCase'],
  'vue/require-component-is': 'error',
  'vue/require-default-prop': 'off',
  'vue/require-direct-export': 'off',
  'vue/require-prop-type-constructor': 'error',
  'vue/require-prop-types': 'error',
  'vue/require-render-return': 'error',
  'vue/require-v-for-key': 'error',
  'vue/require-valid-default-prop': 'off',
  'vue/return-in-computed-property': 'error',
  'vue/script-indent': 'off',
  'vue/script-indent': 'off',
  'vue/singleline-html-element-content-newline': [
    'error',
    {
      ignoreWhenEmpty: true,
      ignoreWhenNoAttributes: true,
      ignores: [
        'a',
        'abbr',
        'audio',
        'b',
        'bdi',
        'bdo',
        'canvas',
        'cite',
        'code',
        'data',
        'del',
        'dfn',
        'em',
        'i',
        'iframe',
        'ins',
        'kbd',
        'label',
        'map',
        'mark',
        'noscript',
        'object',
        'output',
        'picture',
        'q',
        'ruby',
        's',
        'samp',
        'small',
        'span',
        'strong',
        'sub',
        'sup',
        'svg',
        'time',
        'u',
        'var',
        'video'
      ]
    }
  ],
  'vue/space-infix-ops': 'error',
  'vue/space-unary-ops': ['error', { nonwords: false, words: true }],
  'vue/this-in-template': ['error', 'never'],
  'vue/use-v-on-exact': 'off',
  'vue/v-bind-style': 'off',
  'vue/v-on-function-call': 'error',
  'vue/v-on-style': ['error', 'shorthand'],
  'vue/valid-template-root': 'error',
  'vue/valid-v-bind': 'error',
  'vue/valid-v-cloak': 'error',
  'vue/valid-v-else': 'error',
  'vue/valid-v-else-if': 'error',
  'vue/valid-v-for': 'error',
  'vue/valid-v-html': 'error',
  'vue/valid-v-if': 'error',
  'vue/valid-v-model': 'error',
  'vue/valid-v-on': 'error',
  'vue/valid-v-once': 'error',
  'vue/valid-v-pre': 'error',
  'vue/valid-v-show': 'error',
  'vue/valid-v-text': 'error'
};
