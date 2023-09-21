// vitepress/config.js
// import baseConfig from '@vue/theme/config'
// import type { Config as ThemeConfig } from '@vue/theme'

import nav from './nav'
import sidebar from './sidebar'

module.exports = {
    title: "蓝鲸微前端开发框架",// 网站标题 顶部左侧标题
    description: '蓝鲸微前端开发框架', //网站描述
    base: '/', //  部署时的路径 默认 /  可以使用二级地址 /base/
    // lang: 'en-US', //语言
    // 网页头部配置，引入需要图标，css，js
    head: [
        [
            "meta",
            {
                name:"keywords",
                content:"bk-weweb 蓝鲸微前端"
            },
        ],
        [
            "meta",
            {
                name:"description",
                content:"蓝鲸bk-weweb 蓝鲸微前端"
            },
        ],
        // 改变title的图标
        [
            'link',
            {
                rel: 'icon',
                href: '/img/linktolink.png',//图片放在public文件夹下
            },
        ],
    ],
    // 主题配置
    themeConfig: {
        repo: 'https://www.npmjs.com/package/@blueking/bk-weweb',
        //   头部导航
        nav,
        //   侧边导航
        sidebar,
    },
    footer: {
        license: {
            text: 'MIT License',
            link: 'https://opensource.org/licenses/MIT'
        },
        copyright: `Copyright © 2014-${new Date().getFullYear()} Evan You`
    }
}
