# BlueKing Bk-Weweb

---

![Node](https://badgen.net/badge/node/%3E=14.19.0/green?icon=github)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](LICENSE.txt)

![Release](https://badgen.net/github/release/TencentBlueKing/bk-weweb)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/TencentBlueKing/bk-weweb/pulls)

[English](readme_en.md) | 简体中文

## Overview

️🔧 BlueKing bk-weweb 是一款跨框架、无依赖、可伸缩的 无任何侵入的支持微应用、微模块统一的轻量微前端框架工具

## Features

- [Basic] 支持多应用、多模块、及混合应用
- [Basic] bk-weweb webcomponent
- [Basic] 丰富简单的hooks
- [Basic] 支持预加载资源
- [Basic] 主应用与子应用、子模块之间共享缓存资源

## Getting started

### Installation

```bash
$ npm install @blueking/bk-weweb
```

### Usage

> 更多用法参考：[使用文档](https://github.com/TencentBlueKing/bk-weweb/blob/main/docs/docs/intro/hooks.md)

**基础用法**

```javascript
import '@blueking/bk-weweb'

// 微应用
<bk-weweb url='http://www.baidu.com' />

// 微模块
<bk-weweb mode='js' url='http://xxx.xx.x.js' />
```

**自定义微应用容器**

#### 1. 自定义微应用容器

<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"/>
  </div>
</template>
<script lang="ts">
import {defineComponent, onBeforeUnmount, onMounted, ref} from 'vue'
import {loadApp, mount, unmount} from '@blueking/bk-weweb'
export default defineComponent({
  setup() {
    const instanceWrap = ref<HTMLElement>(null)
    const appKey = 'testApp'
    onMounted(async () => {
        await loadApp({
          url: 'http://localhost:8002/',
          id: appKey,
          showSourceCode: true,
          scopeCss: true,
          scopeLocation: true,
          setShadowDom: true,
          keepAlive: false,
          data: {
          
          }
        })
      mount(appKey, instanceWrap.value)
    })
    onBeforeUnmount(() => {
      unmount(appKey)
    })
    return {
      instanceWrap
    }
  }
})
</script>
<style lang="scss">
  .bk-weweb {
    display: flex;
    width: 800px;
    height: 200px;
  }
</style>

#### 2. 自定义微模块容器

```javascript
<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"></div>
  </div>
</template>
<script lang="ts">
import {defineComponent, onBeforeUnmount, onMounted, ref} from 'vue'
import {activated, deactivated, loadInstance} from '@blueking/bk-weweb'
export default defineComponent({
  setup() {
    const instanceWrap = ref<HTMLElement>(null)
    const id = 'test-instance'
    onMounted(async () => {
      await loadInstance({
        //   initSource: [
        //     'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
        //     'https://cdn.jsdelivr.net/npm/echarts@4.8.0/dist/echarts.min.js'
        // ],
          url: 'http://localhost:8004/index.js',
          mode: 'js',
          id: 'test-instance',
          container: instanceWrap.value!,
          showSourceCode: true,
          scopeCss: true,
          scopeJs: true,
          keepAlive: false,
        })
      activated(id, instanceWrap.value)
    })
    onBeforeUnmount(() => {
      deactivated(id)
    })
    return {
      instanceWrap
    }
  }
})
</script>
<style lang="scss">
  .bk-weweb {
    display: flex;
    flex-direction: column;
    width: 800px;
    height: 800px;
  }
</style>
```

## Roadmap

- [版本日志](CHANGELOG.md)

## Support

- [蓝鲸论坛](https://bk.tencent.com/s-mart/community)
- [蓝鲸 DevOps 在线视频教程](https://bk.tencent.com/s-mart/video/)
- [蓝鲸社区版交流群](https://jq.qq.com/?_wv=1027&k=5zk8F7G)

## BlueKing Community

- [BKUI-VUE2](https://github.com/TencentBlueKing/bkui-vue2)：蓝鲸Vue2.0版本组件库。
- [BKUI-VUE3](https://github.com/TencentBlueKing/bkui-vue3)：蓝鲸Vue3.0版本组件库。
- [BK-CMDB](https://github.com/Tencent/bk-cmdb)：蓝鲸配置平台（蓝鲸 CMDB）是一个面向资产及应用的企业级配置管理平台。
- [BK-CI](https://github.com/Tencent/bk-ci)：蓝鲸持续集成平台是一个开源的持续集成和持续交付系统，可以轻松将你的研发流程呈现到你面前。
- [BK-BCS](https://github.com/Tencent/bk-bcs)：蓝鲸容器管理平台是以容器技术为基础，为微服务业务提供编排管理的基础服务平台。
- [BK-PaaS](https://github.com/Tencent/bk-paas)：蓝鲸 PaaS 平台是一个开放式的开发平台，让开发者可以方便快捷地创建、开发、部署和管理 SaaS 应用。
- [BK-SOPS](https://github.com/Tencent/bk-sops)：标准运维（SOPS）是通过可视化的图形界面进行任务流程编排和执行的系统，是蓝鲸体系中一款轻量级的调度编排类 SaaS 产品。
- [BK-JOB](https://github.com/Tencent/bk-job) 蓝鲸作业平台(Job)是一套运维脚本管理系统，具备海量任务并发处理能力。

## Contributing

如果你有好的意见或建议，欢迎给我们提 Issues 或 Pull Requests，为蓝鲸开源社区贡献力量。
[腾讯开源激励计划](https://opensource.tencent.com/contribution) 鼓励开发者的参与和贡献，期待你的加入。

## License

基于 MIT 协议， 详细请参考 [LICENSE](https://github.com/TencentBlueKing/bk-weweb/blob/main/LICENSE.txt)
