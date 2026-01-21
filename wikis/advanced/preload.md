# 预加载

## 概述

BK-WeWeb 提供了预加载功能，可以利用**浏览器空闲时间**提前加载应用和资源。预加载的应用不会立即渲染，而是在需要时快速激活，显著提升用户体验。

## 预加载 API

| API               | 说明           |
| ----------------- | -------------- |
| `preLoadApp`      | 预加载微应用   |
| `preLoadInstance` | 预加载微模块   |
| `preLoadSource`   | 预加载资源文件 |

## preLoadApp - 预加载微应用

### 函数签名

```typescript
function preLoadApp(options: IAppModelProps): void;
```

### 参数

与 `loadApp` 相同，参见 [loadApp 文档](../basic/hooks/load-app.md#参数)。

### 使用示例

```typescript
import { preLoadApp, mount } from '@blueking/bk-weweb';

// 预加载应用
preLoadApp({
  url: 'http://localhost:8001/',
  id: 'dashboard-app',
  scopeJs: true,
  scopeCss: true,
  data: { userId: '123' },
});

// 稍后需要时直接挂载（无需等待加载）
function showDashboard() {
  mount('dashboard-app', document.getElementById('container'));
}
```

### 页面初始化时预加载

```typescript
// main.ts
import { preLoadApp } from '@blueking/bk-weweb';

// 应用启动后预加载常用子应用
window.addEventListener('load', () => {
  // 延迟预加载，避免影响首屏
  setTimeout(() => {
    preLoadApp({
      url: 'http://localhost:8001/',
      id: 'app-1',
      scopeJs: true,
    });

    preLoadApp({
      url: 'http://localhost:8002/',
      id: 'app-2',
      scopeJs: true,
    });
  }, 2000);
});
```

## preLoadInstance - 预加载微模块

### 函数签名

```typescript
function preLoadInstance(options: IJsModelProps): void;
```

### 参数

与 `loadInstance` 相同，参见 [loadInstance 文档](../basic/hooks/load-instance.md#参数)。

### 使用示例

```typescript
import { preLoadInstance, activated, WewebMode } from '@blueking/bk-weweb';

// 预加载图表模块
preLoadInstance({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  scopeJs: true,
  initSource: ['https://cdn.jsdelivr.net/npm/echarts@5.0.0/dist/echarts.min.js'],
});

// 需要时激活
function showChart() {
  activated('chart-widget', document.getElementById('chart-container'));
}
```

## preLoadSource - 预加载资源文件

### 函数签名

```typescript
function preLoadSource(sourceList: SourceType): void;
```

### 参数

| 参数         | 类型                                    | 说明                          |
| ------------ | --------------------------------------- | ----------------------------- |
| `sourceList` | `string[] \| (() => Promise<string[]>)` | 资源 URL 列表或返回列表的函数 |

### 使用示例

```typescript
import { preLoadSource } from '@blueking/bk-weweb';

// 预加载静态资源列表
preLoadSource([
  'https://cdn.example.com/vue@2.6.14/vue.min.js',
  'https://cdn.example.com/echarts@5.0.0/echarts.min.js',
  'https://cdn.example.com/element-ui/index.css',
]);

// 动态获取资源列表
preLoadSource(async () => {
  const response = await fetch('/api/common-resources');
  const data = await response.json();
  return data.resources;
});
```

### 资源类型支持

| 后缀   | 类型       | 处理方式       |
| ------ | ---------- | -------------- |
| `.js`  | JavaScript | 获取内容并缓存 |
| `.css` | CSS        | 获取内容并缓存 |
| 其他   | 忽略       | 输出警告       |

## 实现原理

预加载使用 `requestIdleCallback` API，在浏览器空闲时执行：

```typescript
export function preLoadApp(options: IAppModelProps): void {
  requestIdleCallback(() =>
    loadApp({
      ...options,
      isPreLoad: true, // 标记为预加载
    }),
  );
}
```

### requestIdleCallback

```
┌─────────────────────────────────────────────────────────────┐
│  帧开始                                                      │
│    ↓                                                        │
│  JavaScript 执行                                             │
│    ↓                                                        │
│  样式计算、布局、绘制                                          │
│    ↓                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  空闲时间 (Idle Period)                              │   │
│  │  requestIdleCallback 在这里执行                      │   │
│  └─────────────────────────────────────────────────────┘   │
│    ↓                                                        │
│  下一帧开始                                                   │
└─────────────────────────────────────────────────────────────┘
```

## 预加载策略

### 策略一：路由预测

根据用户当前位置预加载可能访问的页面：

```typescript
import { preLoadApp } from '@blueking/bk-weweb';

// 路由预加载映射
const routePreloadMap: Record<string, string[]> = {
  '/': ['dashboard', 'orders'], // 首页可能访问仪表盘或订单
  '/dashboard': ['orders', 'users'], // 仪表盘可能访问订单或用户
  '/orders': ['order-detail'], // 订单列表可能访问订单详情
};

// 监听路由变化
router.afterEach(to => {
  const appsToPreload = routePreloadMap[to.path] || [];

  appsToPreload.forEach(appId => {
    preLoadApp({
      url: getAppUrl(appId),
      id: appId,
    });
  });
});
```

### 策略二：用户行为预测

根据用户行为预加载：

```typescript
// 鼠标悬停时预加载
document.querySelectorAll('[data-preload-app]').forEach(el => {
  el.addEventListener(
    'mouseenter',
    () => {
      const appId = el.dataset.preloadApp;
      const url = el.dataset.preloadUrl;

      preLoadApp({ url, id: appId });
    },
    { once: true },
  );
});

// 链接即将点击时预加载
document.querySelectorAll('a[data-app]').forEach(link => {
  link.addEventListener('mousedown', () => {
    const appId = link.dataset.app;
    preLoadApp({ url: getAppUrl(appId), id: appId });
  });
});
```

### 策略三：优先级预加载

按优先级分批预加载：

```typescript
interface PreloadConfig {
  url: string;
  id: string;
  priority: 'high' | 'medium' | 'low';
}

const preloadQueue: PreloadConfig[] = [
  { url: 'http://app1.example.com/', id: 'app-1', priority: 'high' },
  { url: 'http://app2.example.com/', id: 'app-2', priority: 'medium' },
  { url: 'http://app3.example.com/', id: 'app-3', priority: 'low' },
];

function executePreload() {
  // 按优先级排序
  const sorted = preloadQueue.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 依次预加载
  sorted.forEach((config, index) => {
    setTimeout(() => {
      preLoadApp({
        url: config.url,
        id: config.id,
      });
    }, index * 500); // 间隔 500ms
  });
}

// 页面加载完成后执行
window.addEventListener('load', () => {
  setTimeout(executePreload, 3000);
});
```

### 策略四：网络感知

根据网络状况调整预加载策略：

```typescript
function shouldPreload(): boolean {
  const connection = (navigator as any).connection;

  if (!connection) return true;

  // 慢速网络不预加载
  if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
    return false;
  }

  // 流量节省模式不预加载
  if (connection.saveData) {
    return false;
  }

  return true;
}

function preloadIfAllowed(url: string, id: string) {
  if (shouldPreload()) {
    preLoadApp({ url, id });
  }
}
```

## 预加载状态管理

```typescript
// preloadManager.ts
import { preLoadApp, preLoadInstance, preLoadSource } from '@blueking/bk-weweb';

interface PreloadStatus {
  isPreloaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

class PreloadManager {
  private status: Map<string, PreloadStatus> = new Map();

  getStatus(id: string): PreloadStatus {
    return (
      this.status.get(id) || {
        isPreloaded: false,
        isLoading: false,
        error: null,
      }
    );
  }

  async preloadApp(url: string, id: string, options = {}) {
    if (this.status.get(id)?.isPreloaded) return;

    this.status.set(id, {
      isPreloaded: false,
      isLoading: true,
      error: null,
    });

    try {
      preLoadApp({ url, id, ...options });

      // 等待一段时间后标记为已预加载
      setTimeout(() => {
        this.status.set(id, {
          isPreloaded: true,
          isLoading: false,
          error: null,
        });
      }, 1000);
    } catch (error) {
      this.status.set(id, {
        isPreloaded: false,
        isLoading: false,
        error: error as Error,
      });
    }
  }

  isPreloaded(id: string): boolean {
    return this.status.get(id)?.isPreloaded || false;
  }
}

export const preloadManager = new PreloadManager();
```

## 性能考虑

### 1. 避免过早预加载

```typescript
// ❌ 不好：立即预加载可能影响首屏
preLoadApp({ url: '...', id: 'app' });

// ✅ 好：等待首屏加载完成
window.addEventListener('load', () => {
  setTimeout(() => {
    preLoadApp({ url: '...', id: 'app' });
  }, 2000);
});
```

### 2. 限制并发数量

```typescript
// 控制同时预加载的数量
const MAX_CONCURRENT = 2;
const queue: Array<() => void> = [];
let running = 0;

function enqueuePreload(fn: () => void) {
  if (running < MAX_CONCURRENT) {
    running++;
    fn();
    setTimeout(() => {
      running--;
      if (queue.length > 0) {
        const next = queue.shift()!;
        enqueuePreload(next);
      }
    }, 1000);
  } else {
    queue.push(fn);
  }
}

// 使用
enqueuePreload(() => preLoadApp({ url: '...', id: 'app-1' }));
enqueuePreload(() => preLoadApp({ url: '...', id: 'app-2' }));
enqueuePreload(() => preLoadApp({ url: '...', id: 'app-3' }));
```

### 3. 监控预加载效果

```typescript
// 预加载性能监控
function preloadWithMetrics(url: string, id: string) {
  const startTime = performance.now();

  preLoadApp({
    url,
    id,
    // 可以传入回调来监控
  });

  // 记录预加载开始
  console.log(`[Preload] Started: ${id}`);

  // 后续激活时可以计算节省的时间
  return () => {
    const endTime = performance.now();
    console.log(`[Preload] ${id} saved ${endTime - startTime}ms`);
  };
}
```

## 类型定义

```typescript
type SourceFuncType = () => Promise<string[]>;
type SourceType = string[] | SourceFuncType;

function preLoadApp(options: IAppModelProps): void;
function preLoadInstance(options: IJsModelProps): void;
function preLoadSource(sourceList: SourceType): void;
```

## 相关文档

- [loadApp](../basic/hooks/load-app.md)
- [loadInstance](../basic/hooks/load-instance.md)
- [initSource 属性](../basic/micro-app/init-source.md)
