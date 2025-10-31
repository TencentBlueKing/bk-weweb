### 微模块模式

> bk-weweb 支持微应用模式 和 微模块模式

#### 什么是微模块模式

> 不同于前面提到的微应用模式需要一个完整的部署应用 而微模块模式只需要一个可执行的 `js` 文件即可。这个js模块导出的所有内容都会在bk-weweb加载后导出同时做到运行环境和样式的隔离，同时这个js模块可以引入其他的模块或者样式，在现代的构建工具（webpack、vite、rollup等）等构建后的产物中的按需加载、external都能支持
> 像这种只加载一个远程的js文件作为入口的模式bk-weweb上统称为微应用模式

#### 一般的使用场景

- 比如您的项目是vue3版本 但是你项目想要加载一个vue2版本实现的组件 这个时候您就可以将这个组件构建出来使用bkweweb的微模块模式来使用
- 还有前端比较常见的插件模式设计上的项目，结合微模块的能力 解决用户自定义插件而不依赖使用的语法、框架同时不需要跟随系统一起构建 保证插件的运行环境的隔离
- 您还可以将一个部署的网站应用构建入口 从 html 改成 js 然后通过微模块的形式加载也能实现微应用的能力

#### 完整配置使用示例

```javascript
import '@bluking/bk-weweb'
<bk-weweb
  id="baidu"
  mode="js"
  url="http://localhost:8001/index.js"
  showSourceCode=true
  scopeLocation=false
  setShadowDom=false
  scopeJs=true
  scopeCss=true
  keepAlive=false/>
```

#### id

用于标识全局唯一的key

- 注意：如果您在使用上在不同的页面上想复用同一个应用 那么可以将在这个两个页面上的bk-weweb设置为相同的id
  那么在页面渲染的时候则会获取到前面一个子应用的资源 不会出现再次重复获取和创建一个一样的子应用

#### mode

用于标识子应用是哪一种类型的应用

- app: 微应用模式
- js: 微模块模式

#### url

加载模块js的地址 为了适应vite构建 如果是 ts 文件默认会强制转换为 module模式

#### showSourceCode

是否显示执行的资源代码 这里特指 css 和 javascript资源

#### scopeJs

是否对javascript执行上下文隔离

#### scopeCss

是否对执行的js模块时产生的css样式进行隔离处理

#### keepAlive

是否缓存子模块渲染的dom 开启后与 vue keep-alive效果一致

- 注意这里只有js模块的返回实例有 `render`函数的特殊场景才能生效

#### data

主应用需要传递给子模块的自定义数据 对应的数据将会注入在子模块上下文 window.**BK_WEWEB_DATA**上

- 注意： 在webcomponent 复杂类型的数据都需要转换为string类型 所以这里的数据和子模块获取的数据引用并不是一个 但是可以通过bk-weweb的hooks
- 来保证同一引用（相关解释请查看 hooks loadApp）

#### 特别的处理

为了适应一般的js模块组件能够直接挂载到dom使用 这里bk-weweb在执行完js模块返回实例后 会判断返回的实例是否有render方法 如果存在render方法那么
会在容器上分配一个dom 传入render方法 并执行(这样做主要是为了方便和适应像 react vue 框架生产的组件 直接挂载)
