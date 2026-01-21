# 全局变量

## 概述

当子应用运行在 BK-WeWeb 环境中时，可以通过特定的全局变量获取运行时信息和主应用传递的数据。

## 可用变量

### **POWERED_BY_BK_WEWEB**

标识当前是否运行在 BK-WeWeb 环境中。

| 属性     | 值            |
| -------- | ------------- |
| 类型     | `boolean`     |
| 可用范围 | 子应用 window |

```typescript
// 子应用入口文件
if (window.__POWERED_BY_BK_WEWEB__) {
  console.log('运行在 BK-WeWeb 环境中');
  // 执行微前端特有逻辑
} else {
  console.log('独立运行');
  // 执行独立运行逻辑
}
```

**使用场景**

```typescript
// 根据环境选择不同的初始化方式
function bootstrap() {
  if (window.__POWERED_BY_BK_WEWEB__) {
    // 作为子应用运行
    const data = window.__BK_WEWEB_DATA__;
    initWithData(data);
  } else {
    // 独立运行
    initStandalone();
  }
}
```

### **BK_WEWEB_APP_KEY**

当前应用的唯一标识符。

| 属性     | 值            |
| -------- | ------------- |
| 类型     | `string`      |
| 可用范围 | 子应用 window |

```typescript
// 获取应用标识
const appKey = window.__BK_WEWEB_APP_KEY__;
console.log('当前应用:', appKey);

// 用于多实例场景
localStorage.setItem(`${appKey}_state`, JSON.stringify(state));
```

**使用场景**

```typescript
// 生成应用专属的存储 key
function getStorageKey(key: string): string {
  const appKey = window.__BK_WEWEB_APP_KEY__ || 'default';
  return `${appKey}:${key}`;
}

// 应用专属的 localStorage
const appStorage = {
  get(key: string) {
    return localStorage.getItem(getStorageKey(key));
  },
  set(key: string, value: string) {
    localStorage.setItem(getStorageKey(key), value);
  },
};
```

### **BK_WEWEB_DATA**

主应用传递给子应用的数据。

| 属性     | 值                        |
| -------- | ------------------------- |
| 类型     | `Record<string, unknown>` |
| 可用范围 | 子应用 window             |

```typescript
// 获取主应用传递的数据
const data = window.__BK_WEWEB_DATA__;

console.log(data.userId);
console.log(data.token);
console.log(data.config);
```

**使用场景**

```typescript
// 初始化应用配置
interface AppData {
  userId: string;
  token: string;
  apiBaseUrl: string;
  permissions: string[];
}

function initApp() {
  const data = window.__BK_WEWEB_DATA__ as AppData;

  // 设置 API 基础路径
  axios.defaults.baseURL = data.apiBaseUrl;

  // 设置请求头
  axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

  // 存储用户信息
  store.commit('SET_USER_ID', data.userId);
  store.commit('SET_PERMISSIONS', data.permissions);
}
```

### rawWindow

原始的 window 对象引用（未被代理的）。

| 属性     | 值                        |
| -------- | ------------------------- |
| 类型     | `Window`                  |
| 可用范围 | 子应用 window（沙箱环境） |

```typescript
// 访问真实的 window
const realWindow = window.rawWindow;

// 添加真正的全局变量
realWindow.myGlobalVar = 'value';

// 访问真实的 location
console.log(realWindow.location.href);
```

**使用场景**

```typescript
// 需要操作真实 window 的场景
function openNewWindow(url: string) {
  const win = window.rawWindow || window;
  win.open(url, '_blank');
}

// 访问主应用的全局配置
function getMainAppConfig() {
  const realWindow = window.rawWindow || window;
  return realWindow.__MAIN_APP_CONFIG__;
}
```

### rawDocument

原始的 document 对象引用（未被代理的）。

| 属性     | 值                        |
| -------- | ------------------------- |
| 类型     | `Document`                |
| 可用范围 | 子应用 window（沙箱环境） |

```typescript
// 访问真实的 document
const realDocument = window.rawDocument;

// 操作真实的 body
realDocument.body.appendChild(element);

// 查询主应用的元素
const mainAppElement = realDocument.querySelector('#main-app');
```

**使用场景**

```typescript
// 在主应用 body 上添加元素（如全局弹窗）
function showGlobalModal(content: string) {
  const realDocument = window.rawDocument || document;

  const modal = document.createElement('div');
  modal.className = 'global-modal';
  modal.innerHTML = content;

  realDocument.body.appendChild(modal);
}

// 添加全局样式
function addGlobalStyle(css: string) {
  const realDocument = window.rawDocument || document;

  const style = document.createElement('style');
  style.textContent = css;

  realDocument.head.appendChild(style);
}
```

### **getAppOrInstance**

获取应用实例的全局方法。

| 属性     | 值                                                    |
| -------- | ----------------------------------------------------- |
| 类型     | `(id?: string) => AppCache \| BaseModel \| undefined` |
| 可用范围 | window                                                |

```typescript
// 获取缓存管理器
const appCache = window.__getAppOrInstance__();

// 获取指定应用实例
const app = window.__getAppOrInstance__('my-app');
console.log(app?.status);
console.log(app?.url);
```

**使用场景**

```typescript
// 调试时查看应用状态
function debugAppState(appId: string) {
  const app = window.__getAppOrInstance__(appId);

  if (app) {
    console.log('App ID:', appId);
    console.log('Status:', app.status);
    console.log('URL:', app.url);
    console.log('Data:', app.data);
  } else {
    console.log('App not found:', appId);
  }
}

// 检查应用是否已加载
function isAppLoaded(appId: string): boolean {
  return !!window.__getAppOrInstance__(appId);
}
```

## TypeScript 类型声明

在子应用中使用 TypeScript 时，可以添加类型声明：

```typescript
// types/bk-weweb.d.ts
interface AppData {
  userId: string;
  token: string;
  permissions: string[];
  config: {
    theme: 'light' | 'dark';
    language: string;
  };
}

declare global {
  interface Window {
    __POWERED_BY_BK_WEWEB__?: boolean;
    __BK_WEWEB_APP_KEY__?: string;
    __BK_WEWEB_DATA__?: AppData;
    rawWindow?: Window;
    rawDocument?: Document;
    __getAppOrInstance__(id?: string): any;
  }
}

export {};
```

## 完整示例

```typescript
// 子应用入口文件
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

// 判断运行环境
const isInMicroApp = !!window.__POWERED_BY_BK_WEWEB__;

// 获取数据
const appKey = window.__BK_WEWEB_APP_KEY__ || 'standalone';
const parentData = window.__BK_WEWEB_DATA__ || {};

// 配置应用
const app = createApp(App);

// 根据环境配置
if (isInMicroApp) {
  // 微前端环境
  console.log(`Running as micro app: ${appKey}`);

  // 使用父应用传递的配置
  app.provide('parentData', parentData);

  // 配置请求拦截器
  axios.interceptors.request.use(config => {
    config.headers['X-App-Key'] = appKey;
    if (parentData.token) {
      config.headers['Authorization'] = `Bearer ${parentData.token}`;
    }
    return config;
  });
} else {
  // 独立运行环境
  console.log('Running standalone');

  // 使用本地配置
  app.provide('parentData', getLocalConfig());
}

// 挂载应用
app.use(router);
app.use(store);
app.mount('#app');
```

## 安全注意事项

### 1. 数据验证

```typescript
// 验证父应用传递的数据
function validateParentData(data: unknown): AppData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid parent data');
  }

  const typedData = data as Partial<AppData>;

  if (!typedData.userId || !typedData.token) {
    throw new Error('Missing required fields');
  }

  return typedData as AppData;
}

const data = validateParentData(window.__BK_WEWEB_DATA__);
```

### 2. 避免直接修改

```typescript
// ❌ 不要直接修改父应用数据
window.__BK_WEWEB_DATA__.someValue = 'new value';

// ✅ 通过通信机制更新
const bridge = window.__BK_WEWEB_DATA__.eventBridge;
bridge.emit('update', { someValue: 'new value' });
```

### 3. 检查变量存在

```typescript
// 安全访问
const appKey = window.__BK_WEWEB_APP_KEY__ ?? 'default';
const data = window.__BK_WEWEB_DATA__ ?? {};
const realWindow = window.rawWindow ?? window;
```

## 相关文档

- [data 属性](../basic/micro-app/data.md)
- [scopeJs 属性](../basic/micro-app/scope-js.md)
- [类型定义](./types.md)
