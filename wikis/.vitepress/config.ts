import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/',
  lang: 'zh-Hans',
  title: 'BK-WeWeb',
  description: '腾讯蓝鲸 · 基于 Web Components 的轻量级微前端框架',
  lastUpdated: true,
  cleanUrls: true,
  head: [['meta', { name: 'theme-color', content: '#3a84ff' }]],
  themeConfig: {
    logo: undefined,
    nav: [
      { text: '指南', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: '微应用', link: '/micro-app/', activeMatch: '/micro-app/' },
      { text: '微模块', link: '/micro-module/', activeMatch: '/micro-module/' },
      {
        text: '生命周期',
        activeMatch: '/hooks/',
        items: [
          { text: 'Hooks 概览', link: '/hooks/' },
          { text: '⭐ 组合与自定义场景', link: '/hooks/compose' },
        ],
      },
      { text: '进阶', link: '/advanced/preload', activeMatch: '/advanced/' },
      { text: 'API', link: '/api/weweb-class', activeMatch: '/api/' },
      { text: '原理', link: '/principles/architecture', activeMatch: '/principles/' },
      {
        text: '0.0.37',
        items: [
          { text: 'NPM', link: 'https://www.npmjs.com/package/@blueking/bk-weweb' },
          { text: 'GitHub', link: 'https://github.com/TencentBlueKing/bk-weweb' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '核心概念', link: '/guide/concepts' },
            { text: '常见问题 FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/micro-app/': [
        {
          text: '微应用 Micro App',
          items: [
            { text: '概览与基础属性', link: '/micro-app/' },
            { text: 'scopeJs · JS 沙箱', link: '/micro-app/scope-js' },
            { text: 'scopeCss · 样式隔离', link: '/micro-app/scope-css' },
            { text: 'scopeLocation · 路由隔离', link: '/micro-app/scope-location' },
            { text: 'setShadowDom · Shadow DOM', link: '/micro-app/shadow-dom' },
            { text: 'keepAlive · 缓存模式', link: '/micro-app/keep-alive' },
            { text: 'showSourceCode · 显示源码', link: '/micro-app/show-source-code' },
          ],
        },
      ],
      '/micro-module/': [
        {
          text: '微模块 Micro Module',
          items: [
            { text: '概览与基础属性', link: '/micro-module/' },
            { text: 'scopeJs · JS 沙箱', link: '/micro-module/scope-js' },
            { text: 'scopeCss · 样式隔离', link: '/micro-module/scope-css' },
            { text: 'keepAlive · 缓存模式', link: '/micro-module/keep-alive' },
            { text: 'showSourceCode · 显示源码', link: '/micro-module/show-source-code' },
            { text: 'render 导出规范', link: '/micro-module/render-specification' },
          ],
        },
      ],
      '/hooks/': [
        {
          text: '生命周期 Hooks',
          items: [
            { text: '概览', link: '/hooks/' },
            { text: '⭐ 组合与自定义场景', link: '/hooks/compose' },
            { text: 'load / loadApp / loadInstance', link: '/hooks/load' },
            { text: 'mount', link: '/hooks/mount' },
            { text: 'unmount', link: '/hooks/unmount' },
            { text: 'activated', link: '/hooks/activated' },
            { text: 'deactivated', link: '/hooks/deactivated' },
            { text: 'unload', link: '/hooks/unload' },
          ],
        },
      ],
      '/advanced/': [
        {
          text: '进阶 Advanced',
          items: [
            { text: '预加载', link: '/advanced/preload' },
            { text: '数据通信', link: '/advanced/communication' },
            { text: '主应用资源共享', link: '/advanced/base-source' },
            { text: '自定义资源获取', link: '/advanced/fetch-source' },
            { text: 'Vite 集成', link: '/advanced/vite-plugin' },
            { text: '自定义微应用', link: '/advanced/custom-micro-app' },
            { text: '自定义微模块', link: '/advanced/custom-micro-module' },
            { text: '框架集成', link: '/advanced/framework-integration' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'WeWeb 类与 start', link: '/api/weweb-class' },
            { text: '全局变量', link: '/api/global-variables' },
            { text: '类型定义', link: '/api/types' },
          ],
        },
      ],
      '/principles/': [
        {
          text: '实现原理',
          items: [
            { text: '整体架构', link: '/principles/architecture' },
            { text: '沙箱实现', link: '/principles/sandbox' },
            { text: '资源解析', link: '/principles/entry' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/TencentBlueKing/bk-weweb' }],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    lastUpdated: { text: '最后更新于' },
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2021-present Tencent BlueKing',
    },
  },
});
