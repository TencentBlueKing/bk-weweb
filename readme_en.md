# BlueKing Bk-Weweb

---

![Node](https://badgen.net/badge/node/%3E=14.19.0/green?icon=github)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](LICENSE.txt)

![Release](https://badgen.net/github/release/TencentBlueKing/bk-weweb)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/TencentBlueKing/bk-weweb/pulls)

English | [简体中文](readme.md)

## Overview

️🔧 BlueKing bk-weweb is a cross-framework, dependency-free, scalable, lightweight micro-front-end framework tool that supports micro-applications and micro-modules without any intrusion

## Features

- [Basic] supports multi-application, multi-module, and mixed application
- [Basic] bk-weweb webcomponent
- [Basic] rich and simple hooks
- [Basic] Support preloading resources
- [Basic] Share cache resources between the main application and sub-applications and sub-modules

## Getting started

### Installation

```bash
$ npm install @blueking/bk-weweb
```

### Usage

> More usage reference: [Usage Documentation](https://github.com/TencentBlueKing/bk-weweb/blob/main/docs/docs/intro/hooks.md)

**Basic usage**

```javascript
import '@blueking/bk-weweb'

// 微应用
<bk-weweb url='http://www.baidu.com' />

// 微模块
<bk-weweb mode='js' url='http://xxx.xx.x.js' />
```

**Custom microapp container**

#### 1. Custom microapp container

```javascript
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
```

#### 2. Custom Micromodule Container

```javascript
<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"></div>
  </div>
</template>
<script lang="ts">
import {defineComponent, onBeforeUnmount, onMounted, ref} from 'vue'
import {activated, deactivated, loadInstance, WEWEB_MODE} from '@blueking/bk-weweb'
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
          mode: WEWEB_MODE.INSTANCE,
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

- [Version Log](CHANGELOG.md)

## Support

- [BlueKing Forum](https://bk.tencent.com/s-mart/community)
- [BlueKing DevOps Online Video Tutorial](https://bk.tencent.com/s-mart/video/)
- [BlueKing Community Edition Exchange Group](https://jq.qq.com/?_wv=1027&k=5zk8F7G)

## BlueKing Community

- [BKUI-VUE2](https://github.com/TencentBlueKing/bkui-vue2)：BlueKing Vue2.x version component library.
- [BKUI-VUE3](https://github.com/TencentBlueKing/bkui-vue3)：BlueKing Vue3.x version component library.
- [BK-CMDB](https://github.com/Tencent/bk-cmdb): BlueKing CMDB is an enterprise-level management platform designed for assets and applications.
- [BK-CI](https://github.com/Tencent/bk-ci): BlueKing Continuous Integration platform is a free, open source CI service, which allows developers to automatically create - test - release workflow, and continuously, efficiently deliver their high-quality products.
- [BK-BCS](https://github.com/Tencent/bk-bcs): BlueKing Container Service is a container-based basic service platform that provides management service to microservice businesses.
- [BK-PaaS](https://github.com/Tencent/bk-paas): BlueKing PaaS is an open development platform that allows developers to efficiently create, develop, set up, and manage SaaS apps.
- [BK-SOPS](https://github.com/Tencent/bk-sops): BlueKing SOPS is a system that features workflow arrangement and execution using a graphical interface. It's a lightweight task scheduling and arrangement SaaS product of the Blueking system.
- [BK-JOB](https://github.com/Tencent/bk-job):BlueKing JOB is a set of operation and maintenance script management platform with the ability to handle a large number of tasks concurrently.
-

## Contributing

If you have good comments or suggestions, please send us Issues or Pull Requests to contribute to the Blue Whale open source community.
[Tencent Open Source Incentive Program](https://opensource.tencent.com/contribution) encourages developers to participate and contribute, and look forward to your joining.

## License

Based on the MIT protocol, please refer to [LICENSE](https://github.com/TencentBlueKing/bk-weweb/blob/main/LICENSE.txt) for details
