# 微应用模式

## 概述

微应用模式是 BK-WeWeb 的核心运行模式之一，用于加载一个**独立部署的远程应用**。与传统的 iframe 嵌入方式不同，微应用与主应用共享浏览器上下文，子应用以组件的方式无缝集成到主应用页面中。

## 什么是微应用

微应用是一个完整的、独立部署的前端应用，它具有：

- 独立的代码仓库
- 独立的开发、测试、部署流程
- 完整的 HTML 入口文件
- 可以单独访问运行

BK-WeWeb 通过解析微应用的 HTML 入口，自动提取其中的 CSS 和 JavaScript 资源，在隔离环境中执行，最终将渲染结果嵌入到主应用的 `<bk-weweb>` 容器中。

## 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│  1. 获取 HTML Entry                                          │
│     fetch('http://child-app.example.com/')                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 解析资源                                                  │
│     - 提取 <link> 标签中的 CSS                               │
│     - 提取 <script> 标签中的 JS                              │
│     - 保留 HTML 结构                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 处理隔离                                                  │
│     - CSS: 添加作用域前缀                                     │
│     - JS: 创建 Proxy 沙箱环境                                │
│     - Location: 创建独立路由环境（可选）                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 渲染挂载                                                  │
│     - 将处理后的 HTML 插入容器                                │
│     - 执行 CSS 样式                                          │
│     - 在沙箱中执行 JS                                        │
└─────────────────────────────────────────────────────────────┘
```

## 基础使用

### Web Component 方式

```html
<bk-weweb
  id="my-app"
  url="http://localhost:8001/"
></bk-weweb>
```

### Hooks 方式

```typescript
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

// 加载应用
await loadApp({
  url: 'http://localhost:8001/',
  id: 'my-app',
});

// 挂载到容器
mount('my-app', document.getElementById('container'));

// 卸载应用
unmount('my-app');
```

## 配置属性

微应用模式支持以下配置属性：

| 属性                                    | 类型       | 默认值  | 必填   | 说明               |
| --------------------------------------- | ---------- | ------- | ------ | ------------------ |
| [id](./id.md)                           | `string`   | -       | 否     | 应用唯一标识符     |
| [url](./url.md)                         | `string`   | -       | **是** | 应用入口 URL       |
| [mode](./mode.md)                       | `'app'`    | `'app'` | 否     | 运行模式           |
| [scopeJs](./scope-js.md)                | `boolean`  | `true`  | 否     | JS 沙箱隔离        |
| [scopeCss](./scope-css.md)              | `boolean`  | `true`  | 否     | CSS 样式隔离       |
| [scopeLocation](./scope-location.md)    | `boolean`  | `false` | 否     | 路由隔离           |
| [setShadowDom](./set-shadow-dom.md)     | `boolean`  | `false` | 否     | Shadow DOM 模式    |
| [keepAlive](./keep-alive.md)            | `boolean`  | `false` | 否     | 缓存模式           |
| [showSourceCode](./show-source-code.md) | `boolean`  | `false` | 否     | 显示源码           |
| [data](./data.md)                       | `string`   | -       | 否     | 传递给子应用的数据 |
| [initSource](./init-source.md)          | `string[]` | -       | 否     | 初始化资源列表     |

## 完整配置示例

```typescript
// Web Component 方式
<bk-weweb
  id="dashboard-app"
  url="http://localhost:8001/"
  mode="app"
  :scope-js="true"
  :scope-css="true"
  :scope-location="false"
  :set-shadow-dom="false"
  :keep-alive="true"
  :show-source-code="false"
  :data="JSON.stringify({
    userId: '12345',
    token: 'xxx',
    theme: 'dark'
  })"
/>

// Hooks 方式
import { loadApp, mount } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard-app',
  scopeJs: true,
  scopeCss: true,
  scopeLocation: false,
  keepAlive: true,
  showSourceCode: false,
  data: {
    userId: '12345',
    token: 'xxx',
    theme: 'dark'
  },
  initSource: [
    'https://cdn.example.com/vue.min.js',
    'https://cdn.example.com/common.css'
  ]
});

mount('dashboard-app', document.getElementById('app-container'));
```

## 生命周期

微应用的生命周期状态流转：

```
UNSET → LOADING → LOADED → MOUNTING → MOUNTED
                                ↓
                           ACTIVATED ⟷ DEACTIVATED
                                ↓
                            UNMOUNT
```

| 状态          | 说明                     |
| ------------- | ------------------------ |
| `UNSET`       | 初始状态                 |
| `LOADING`     | 正在加载资源             |
| `LOADED`      | 资源加载完成             |
| `MOUNTING`    | 正在挂载                 |
| `MOUNTED`     | 已挂载完成               |
| `ACTIVATED`   | 已激活（keepAlive 模式） |
| `DEACTIVATED` | 已停用（keepAlive 模式） |
| `UNMOUNT`     | 已卸载                   |
| `ERROR`       | 加载出错                 |

## 适用场景

微应用模式适用于以下场景：

1. **独立部署的子应用**

   - 有独立的开发团队维护
   - 需要独立上线部署
   - 有完整的应用入口

2. **技术栈异构**

   - 主应用使用 Vue，子应用使用 React
   - 子应用使用不同版本的框架

3. **渐进式迁移**
   - 老系统逐步迁移到新框架
   - 保留原有应用，逐步集成

## 注意事项

1. **CORS 配置**

   子应用需要配置正确的 CORS 头，允许主应用域名跨域访问：

   ```
   Access-Control-Allow-Origin: http://main-app.example.com
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```

2. **资源路径**

   子应用的静态资源路径需要使用绝对路径或正确配置 publicPath。

3. **全局变量**

   开启 JS 沙箱后，子应用的全局变量会被隔离。如需访问真实的 window，可通过 `window.rawWindow` 获取。

## 相关链接

- [微模块模式](../micro-module/README.md)
- [Hooks API](../hooks/README.md)
- [自定义微应用容器](../../advanced/custom-micro-app.md)
