### bk-weweb hooks

> bk-weweb 提供了一套用于用户自定义适应自己项目环境的微前端框架的函数，使用这些函数可以帮助您创建 例如 react vue各个版本下微前端组件
> 介于浏览器不同版本上的兼容性 以及传递数据保存数据引用 我们强烈推荐使用这些函数来创建自己的微前端框架组件 而不是使用系统自带的bk-weweb标签

#### 示例 vue3 自定义微应用容器

[更多示例请查看](https://www.npmjs.com/package/@blueking/bk-weweb)

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

#### 示例 vue3 自定义微模块容器

```javascript
<template>
  <div class="bk-weweb">
    <div ref="instanceWrap"></div>
  </div>
</template>
<script lang="ts">
import {defineComponent, onBeforeUnmount, onMounted, ref} from 'vue'
import {activated, deactivated, loadInstance, WewebMode} from '@blueking/bk-weweb'
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
          mode: WewebMode.INSTANCE,
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

### 有哪些hooks

<br/>
<br/>
- #### load
  > 加载子应用或者子模块 传递的参数与前面介绍的两种模式所需的参数一致

##### 参数类型：

```javascript
interface IModleProps {
  // entry mode js | config | html 默认 html
  [ObserveAttrs.mode]?: WewebMode;
  // url 必选
  [ObserveAttrs.url]: string;
  // 是否是预加载
  isPreLoad?: boolean;
  id?: string | null;
  container?: HTMLElement | ShadowRoot | null;
  // 是否启用样式隔离 默认隔离
  [ObserveAttrs.scopeCss]?: boolean;
  // 是否使用沙盒隔离 默认隔离
  [ObserveAttrs.scopeJs]?: boolean;
  // 是否缓存dom
  [ObserveAttrs.keepAlive]?: boolean;
  // 是否在dom上显示源码 默认不显示 内存执行
  [ObserveAttrs.showSourceCode]?: boolean;
  // 是否共享主应用路由
  [ObserveAttrs.scopeLocation]?: boolean;
  // 是否使用shadowDom
  [ObserveAttrs.setShadowDom]?: boolean;
  // 传递给子应用的数据 默认保存
  [ObserveAttrs.data]?: Record<string, unknown>;
  // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
  initSource?: SourceType
}
export type SourceFuncType = () => Promise<string[]>;
export type SourceType = string[] | SourceFuncType;
```

- #### loadApp

  > 加载一个子应用

  ##### 参数类型：

  ```javascript
  interface IAppModleProps {
    // url 必选
    [ObserveAttrs.url]: string;
    // 是否是预加载
    isPreLoad?: boolean;
    id?: string | null;
    container?: HTMLElement | ShadowRoot | null;
    // 是否启用样式隔离 默认隔离
    [ObserveAttrs.scopeCss]?: boolean;
    // 是否使用沙盒隔离 默认隔离
    [ObserveAttrs.scopeJs]?: boolean;
    // 是否缓存dom
    [ObserveAttrs.keepAlive]?: boolean;
    // 是否在dom上显示源码 默认不显示 内存执行
    [ObserveAttrs.showSourceCode]?: boolean;
    // 是否共享主应用路由
    [ObserveAttrs.scopeLocation]?: boolean;
    // 是否使用shadowDom
    [ObserveAttrs.setShadowDom]?: boolean;
    // 传递给子应用的数据 默认保存
    [ObserveAttrs.data]?: Record<string, unknown>;
    // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
    initSource?: SourceType
  }
  export type SourceFuncType = () => Promise<string[]>;
  export type SourceType = string[] | SourceFuncType;
  ```

- #### loadInstance

  > 加载一个微模块

  ##### 参数类型：

  ```javascript
  interface IAppModleProps {
    // url 必选
    [ObserveAttrs.url]: string;
    // 是否是预加载
    isPreLoad?: boolean;
    id?: string | null;
    // 容器
    container?: HTMLElement | ShadowRoot | null;
    // 是否使用沙盒隔离 默认不隔离
    scopeJs?: boolean;
    // 是否启用样式隔离 默认隔离
    scopeCss?: boolean;
    // 是否缓存dom
    keepAlive?: boolean;
    // 是否在dom上显示源码 默认显示
    [ObserveAttrs.showSourceCode]?: boolean;
    // 传递给实例render方法的数据
    [ObserveAttrs.data]?: Record<string, unknown>;
    // 初始化source 如 ['http://www.hostname.com/a.js', 'http://www.hostname.com/b.css']
    initSource?: SourceType
  }
  export type SourceFuncType = () => Promise<string[]>;
  export type SourceType = string[] | SourceFuncType;
  ```

- #### mount

  > 挂载子应用 或者 子模块 执行时机在laod hook之后

  ##### 类型：

  ```javascript
  export declare function mount<T>(
    appKey: string, // 子应用和子模块的id
    container?: HTMLElement | ShadowRoot, // 子应用和子模块需要挂载的容器
    callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void // 挂载之后触发的回调
    ): void;
  ```

- #### unmount
  > 删除退出 子应用 或者 子模块

```javascript
 export declare function unmount(appKey: string): void;
```

- #### unload
  > 删除系统内缓存的 对应子应用 或者 子模块资源

```javascript
 export declare function unload(url: string): void;
```

- #### activated
  > 已经加载过的应用或模块 再次使用 如果是第一加载则直接与mount 等效

```javascript
 import { BaseModel } from '../typings';
 export declare function activated<T>(appKey: string, container: HTMLElement | ShadowRoot, callback?: <M extends BaseModel>(instance: M, exportInstance?: T) => void): void;
```

- #### deactivated
  > 清除对应已经加载过的应用后模块 已缓存的资源不会清除

```javascript
 export declare function deactivated(appKey: string): void;
```
