### 微应用模式
> bk-weweb 支持微应用模式 和 微模块模式

#### 什么是微应用模式

> 和市面上大部分开源的微前端框架的一样 解决iframe嵌入一个独立部署的远程应用 替代为我们的微前端容器嵌入 但又区别于使用iframe嵌入让各个子应用与主应用共享全局上下文 让子应用以组件的方式加入到应用页面的组成构建中来 而这类可加载远程应用的方案 
> bk-weweb上统称为微应用模式 

#### 完整配置使用示例

```javascript
import '@bluking/bk-weweb'
<bk-weweb
  id="baidu" 
  mode="app" 
  url="http://localhost:8001/index.html"
  showSourceCode=true
  scopeLocation=false
  setShodowDom=false
  data='JSON.stringfiy({a: 1})'
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
- app: 微应用模式（默认值）
- js: 微模块模式

#### url
加载子应用时的入口 

-注意 这里url也是可以带上`hash` `query` 等[url规范](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL)的其他字段 如果您设置了scopeLocation那么这些字段都将留下来在内置封闭的`Location`流转

#### showSourceCode
是否显示执行的资源代码 这里特指 css 和 javascript资源 如果设置为 `true` 则在 页面html中会以内联嵌入的方式展示

#### scopeLocation
浏览器地址栏地址与子应用路不再关联 而是内部分配独立的location 和 history 保证子应用相互之间路由上互不影响

`这个属性是用来做什么的？`

  通常情况下主应用和子应用之间是共享同一个 Location 和 History 实例的保证父子应用之间的路由都能在浏览器的地址栏响应

  但是难免需要父子应用之间需要做的路由的隔离 那么这个时候你就需要使用这个属性来配置子应用的路由隔离 

  例如 在多应用组装页面等复杂的使用场景情况下

  在主应用页面下 需要加载多个不同的应用 而每一个应用都有一个自己的路由 当这些应用的路由发生冲突时 那么你可以通过对其中的子应用设置这个属性来
  做到给与子应用分配独立的location 和 history 保证相互之间互不影响
  
#### setShodowDom
在webcomponent api下是否开启shadow dom渲染

-注意：如果开启了shadowdom渲染 那么自动使用shadowdom的样式隔离机制也就是 下面的 `scopeCss` 属性将会失效

#### scopeJs
是否对javascript执行上下文隔离 

#### scopeCss
是否对子应用的样式进行隔离处理 不影响主应用的dom效果

#### keepAlive
是否缓存子应用 开启后与 vue keep-alive效果类似

#### data
主应用需要传递给子应用的自定义数据 对应的数据将会注入在子应用上下文 window.__BK_WEWEB_DATA__上
- 注意： 在webcomponent 复杂类型的数据都需要转换为string类型 所以这里的数据和子应用获取的数据引用并不是一个 但是可以通过bk-weweb的hooks来保证同一引用（相关解释请查看 hooks loadApp）
  
