### 全局属性
> bk-weweb全局属性配置在 入口的 `start` 函数内启动

#### 完整配置使用示例

```javascript
import bkWeWeb from '@bluking/bk-weweb'
bkWeWeb.start({
  fetchSource: (url, options) => window.fetch(url),
  webcomponentTag: 'bk-weweb',
  collectBaseSource: false
})
```

#### fetchSource

用于替换`bk-weweb`内部发起获取资源请求 默认是使用 `window.fetch api`

* 参数
  - `url`: 请求资源的地址
  - `options`: fetch请求时的而外配置 例如在请求`html`文件时会默认加上 `no-cache`标识


#### webcomponentTag

用于替换`bk-weweb`webcomponent 标签名称

* 默认 `bk-weweb`

#### collectBaseSource

用于配置是否收集主应用的静态资源（js、css）主要的目的是做到子应用或者子模块与主应用的资源共享 达到最低限度资源共享优化 加速加速子应用和父应用的渲染
默认是不开启， 如果设置为 `true` 那么在执行bk-weweb 主程序后 接下来的主应用的所用js 和 css资源的请求将会通过fetchSource 方法来获取
这里虽然能做到父子资源的共享，减少静态资源的请求，加速子应用和父应用的渲染 因为替换了fecth获取资源 那么http网络的强缓存则无法作用了
所以开启后需要开发者斟酌是否带来收益