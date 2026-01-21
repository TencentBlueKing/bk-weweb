# unload

## 概述

`unload` 用于**从缓存中完全删除应用或模块**。与 `unmount` 不同，`unload` 会清除所有已加载的资源缓存，下次使用需要重新加载。

## 函数签名

```typescript
function unload(url: string): void;
```

## 参数

| 参数  | 类型     | 必填   | 说明            |
| ----- | -------- | ------ | --------------- |
| `url` | `string` | **是** | 应用/模块的 URL |

> **注意**：参数是 `url`，不是 `id`。

## 返回值

```typescript
void
```

## 使用示例

### 基础用法

```typescript
import { loadApp, mount, unmount, unload } from '@blueking/bk-weweb';

const appUrl = 'http://localhost:8001/';

// 加载并挂载
await loadApp({ url: appUrl, id: 'my-app' });
mount('my-app', document.getElementById('container'));

// 卸载（DOM 清除，缓存保留）
unmount('my-app');

// 删除缓存
unload(appUrl);

// 下次使用需要重新加载
await loadApp({ url: appUrl, id: 'my-app' }); // 重新获取资源
```

### 强制刷新

```typescript
import { loadApp, mount, unmount, unload } from '@blueking/bk-weweb';

async function refreshApp(url: string, id: string) {
  // 先卸载
  unmount(id);

  // 删除缓存
  unload(url);

  // 重新加载
  await loadApp({ url, id });

  // 重新挂载
  mount(id, document.getElementById('container'));
}

// 使用
await refreshApp('http://localhost:8001/', 'my-app');
```

### 清理不再需要的应用

```typescript
import { loadApp, unload } from '@blueking/bk-weweb';

// 应用管理
const loadedApps = new Map<string, string>(); // id -> url

async function loadAppWithTracking(url: string, id: string) {
  await loadApp({ url, id });
  loadedApps.set(id, url);
}

function unloadApp(id: string) {
  const url = loadedApps.get(id);
  if (url) {
    unload(url);
    loadedApps.delete(id);
  }
}

// 清理所有已加载的应用
function unloadAllApps() {
  for (const [id, url] of loadedApps) {
    unload(url);
  }
  loadedApps.clear();
}
```

### 版本更新

```typescript
import { loadApp, mount, unmount, unload } from '@blueking/bk-weweb';

async function updateApp(oldUrl: string, newUrl: string, id: string) {
  // 卸载旧版本
  unmount(id);
  unload(oldUrl);

  // 加载新版本
  await loadApp({ url: newUrl, id });
  mount(id, document.getElementById('container'));
}

// 使用
await updateApp(
  'http://localhost:8001/v1/', // 旧版本
  'http://localhost:8001/v2/', // 新版本
  'my-app',
);
```

## 内部实现

```typescript
export function unload(url: string): void {
  appCache.deleteApp(url);
}
```

`unload` 只是简单地从缓存中删除对应 URL 的应用实例。

## 与 unmount 的对比

| 特性     | unmount        | unload             |
| -------- | -------------- | ------------------ |
| 参数     | `appKey` (id)  | `url`              |
| 清除 DOM | ✅             | ❌（需先 unmount） |
| 清除缓存 | ❌             | ✅                 |
| 下次使用 | 直接 mount     | 需重新 load        |
| 保留样式 | 否             | 否                 |
| 保留脚本 | 是（在缓存中） | 否                 |

### 完整清理流程

```typescript
// 完整清理一个应用
function destroyApp(id: string, url: string) {
  // 1. 先卸载 DOM
  unmount(id);

  // 2. 再删除缓存
  unload(url);
}
```

## 注意事项

### 1. 使用 URL 而不是 ID

```typescript
// ✅ 正确：使用 URL
unload('http://localhost:8001/');

// ❌ 错误：使用 ID
// unload('my-app');  // 无效
```

### 2. 先卸载再删除缓存

```typescript
// ✅ 正确顺序
unmount('my-app');
unload('http://localhost:8001/');

// ⚠️ 只删除缓存，DOM 可能残留
unload('http://localhost:8001/'); // 缓存删除，但 DOM 还在
```

### 3. 多个应用使用相同 URL

如果多个应用使用相同的 URL，`unload` 会影响所有这些应用：

```typescript
// 两个应用使用相同 URL
await loadApp({ url: 'http://localhost:8001/', id: 'app-1' });
await loadApp({ url: 'http://localhost:8001/', id: 'app-2' });

// unload 会影响两者
unload('http://localhost:8001/');

// 两个都需要重新加载
await loadApp({ url: 'http://localhost:8001/', id: 'app-1' });
await loadApp({ url: 'http://localhost:8001/', id: 'app-2' });
```

### 4. 内存释放

`unload` 后，之前加载的脚本和样式资源会被 GC 回收（如果没有其他引用）。

## 使用场景

### 场景一：热更新

应用有新版本时，强制重新加载：

```typescript
async function hotReload(url: string, id: string) {
  unmount(id);
  unload(url);
  await loadApp({ url: `${url}?t=${Date.now()}`, id }); // 加缓存破坏
  mount(id, document.getElementById('container'));
}
```

### 场景二：释放内存

长时间未使用的应用，释放其占用的内存：

```typescript
const appLastAccess = new Map<string, number>();

function trackAccess(url: string) {
  appLastAccess.set(url, Date.now());
}

function cleanupUnusedApps(maxAge: number = 10 * 60 * 1000) {
  const now = Date.now();
  for (const [url, lastAccess] of appLastAccess) {
    if (now - lastAccess > maxAge) {
      unload(url);
      appLastAccess.delete(url);
    }
  }
}

// 定期清理
setInterval(() => cleanupUnusedApps(), 60 * 1000);
```

### 场景三：切换环境

从开发环境切换到生产环境：

```typescript
async function switchEnvironment(env: 'dev' | 'prod', id: string) {
  const urls = {
    dev: 'http://localhost:8001/',
    prod: 'https://app.example.com/',
  };

  // 清理旧环境
  unmount(id);
  unload(urls.dev);
  unload(urls.prod);

  // 加载新环境
  await loadApp({ url: urls[env], id });
  mount(id, document.getElementById('container'));
}
```

## 类型定义

```typescript
/**
 * 从缓存中删除应用
 * @param url - 应用的 URL
 */
function unload(url: string): void;
```

## 相关函数

- [unmount](./unmount.md) - 卸载（保留缓存）
- [loadApp](./load-app.md) - 加载微应用
- [loadInstance](./load-instance.md) - 加载微模块
