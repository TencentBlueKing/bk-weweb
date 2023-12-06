module.exports = {
  extends: ['stylelint-config-recommended-vue', 'stylelint-config-recess-order'],
  overrides: [
    {
      customSyntax: 'postcss-scss',
      files: ['*.scss', '*.css', './**/*.scss'],
    },
    {
      customSyntax: 'postcss-html',
      files: ['*.vue', './**/*.vue'],
    },
  ],
  plugins: ['stylelint-scss', 'stylelint-order'],
  rules: {
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['first-nested', 'blockless-after-blockless'],
        ignore: ['after-comment'],
      },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['/.*/'],
      },
    ],
    'at-rule-no-vendor-prefix': true,
    'block-opening-brace-space-before': 'always',
    // 颜色值要小写
    'color-hex-case': 'lower',
    // 颜色值能短则短
    'color-hex-length': 'short',
    'comment-empty-line-before': ['always', { except: ['first-nested'] }],
    'declaration-block-single-line-max-declarations': 1,
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    // 不能用important
    'declaration-no-important': true,
    // Base rules
    indentation: 2,
    // Sass rules
    'max-nesting-depth': 10,
    // 不要使用已被 autoprefixer 支持的浏览器前缀
    'media-feature-name-no-vendor-prefix': true,

    'number-leading-zero': 'never',
    'order/order': ['declarations', { type: 'at-rule' }, { hasBlock: true, type: 'at-rule' }, 'rules'],
    'property-no-vendor-prefix': true,
    // 去掉多个import、extends、父子声明之间的空行 --开始
    'rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'scss/at-extend-no-missing-placeholder': true,
    'scss/dollar-variable-pattern': '^_?[a-z]+[\\w-]*$',
    'selector-list-comma-newline-after': 'always',
    'selector-max-id': 3,
    'selector-no-vendor-prefix': true,
    'string-quotes': 'single',
    'value-no-vendor-prefix': true,
  },
};
