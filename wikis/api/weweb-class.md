# WeWeb 类

## 概述

`WeWeb` 是 BK-WeWeb 的主入口类，提供框架的全局配置和初始化功能。

## 导入方式

```typescript
import weWeb from '@blueking/bk-weweb';
```

## 方法

### start

启动并配置 BK-WeWeb 框架。

#### 函数签名

```typescript
start(option?: IStartOption): void
```

#### 参数

| 参数     | 类型           | 必填 | 说明         |
| -------- | -------------- | ---- | ------------ |
| `option` | `IStartOption` | 否   | 启动配置选项 |

#### IStartOption

```typescript
interface IStartOption {
  /**
   * 是否收集基础资源
   * @description 开启后会收集主应用已加载的脚本和样式
   * @default false
   */
  collectBaseSource?: boolean;

  /**
   * 自定义资源获取函数
   * @description 用于自定义 HTTP 请求逻辑
   */
  fetchSource?: (url: string, options: Record<string, unknown>) => Promise<string>;

  /**
   * 自定义 Web Component 标签名
   * @description 默认为 'bk-weweb'
   * @default 'bk-weweb'
   */
  webComponentTag?: string;
}
```

#### 使用示例

```typescript
import weWeb from '@blueking/bk-weweb';

// 基础启动
weWeb.start();

// 完整配置
weWeb.start({
  collectBaseSource: true,
  webComponentTag: 'my-micro-app',
  fetchSource: async (url, options) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Custom-Header': 'value',
      },
    });
    return response.text();
  },
});
```

## 配置详解

### collectBaseSource

收集主应用已加载的资源，用于子应用共享。

```typescript
weWeb.start({
  collectBaseSource: true,
});
```

开启后，BK-WeWeb 会遍历主应用的 `<script>` 和 `<link>` 标签，将已加载的资源记录到缓存中。当子应用需要相同的资源时，可以直接复用。

**工作原理**

```typescript
// 内部实现
if (option.collectBaseSource) {
  const scripts = document.querySelectorAll('script[src]');
  const links = document.querySelectorAll('link[rel="stylesheet"]');

  // 收集到 baseSource 缓存
  scripts.forEach(script => {
    baseSource.set(script.src, script.textContent || '');
  });
}
```

### fetchSource

自定义资源获取函数，用于处理特殊的请求需求。

```typescript
weWeb.start({
  fetchSource: async (url, options) => {
    // 添加认证头
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getToken()}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    return response.text();
  },
});
```

**使用场景**

1. **添加认证信息**

   ```typescript
   fetchSource: async (url, options) => {
     const response = await fetch(url, {
       ...options,
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });
     return response.text();
   };
   ```

2. **请求代理**

   ```typescript
   fetchSource: async (url, options) => {
     const proxyUrl = `/proxy?url=${encodeURIComponent(url)}`;
     const response = await fetch(proxyUrl, options);
     return response.text();
   };
   ```

3. **缓存控制**

   ```typescript
   const cache = new Map<string, string>();

   fetchSource: async (url, options) => {
     if (cache.has(url)) {
       return cache.get(url)!;
     }

     const response = await fetch(url, options);
     const content = await response.text();
     cache.set(url, content);
     return content;
   };
   ```

4. **错误处理**
   ```typescript
   fetchSource: async (url, options) => {
     try {
       const response = await fetch(url, {
         ...options,
         timeout: 10000,
       });
       return response.text();
     } catch (error) {
       console.error(`Failed to fetch ${url}:`, error);
       throw error;
     }
   };
   ```

### webComponentTag

自定义 Web Component 标签名。

```typescript
weWeb.start({
  webComponentTag: 'my-micro-app',
});

// 使用自定义标签
// <my-micro-app url="..." id="..."></my-micro-app>
```

**注意**：自定义标签名必须包含连字符（-），这是 Web Components 标准的要求。

## 完整示例

### 生产环境配置

```typescript
// main.ts
import weWeb from '@blueking/bk-weweb';

// 生产环境配置
weWeb.start({
  collectBaseSource: true,
  fetchSource: async (url, options) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Request-Id': generateRequestId(),
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // 上报错误
      reportError({
        type: 'RESOURCE_LOAD_ERROR',
        url,
        status: response.status,
      });
      throw new Error(`Resource load failed: ${url}`);
    }

    return response.text();
  },
});
```

### 开发环境配置

```typescript
// main.ts
import weWeb from '@blueking/bk-weweb';

if (import.meta.env.DEV) {
  weWeb.start({
    collectBaseSource: false, // 开发环境不收集
    fetchSource: async (url, options) => {
      console.log('[WeWeb] Fetching:', url);
      const start = performance.now();

      const response = await fetch(url, options);
      const content = await response.text();

      console.log(`[WeWeb] Loaded ${url} in ${performance.now() - start}ms`);
      return content;
    },
  });
} else {
  weWeb.start({
    collectBaseSource: true,
  });
}
```

## 内部实现

```typescript
class WeWeb {
  private webComponentTag = 'bk-weweb';

  start(option?: IStartOption): void {
    // 收集基础资源
    if (option?.collectBaseSource) {
      this.collectBaseSource();
    }

    // 设置自定义 fetch
    if (option?.fetchSource) {
      setFetchSource(option.fetchSource);
    }

    // 注册自定义标签
    if (option?.webComponentTag) {
      this.webComponentTag = option.webComponentTag;
    }

    // 定义 Web Component
    this.defineWebComponent();
  }

  private defineWebComponent(): void {
    if (!customElements.get(this.webComponentTag)) {
      customElements.define(this.webComponentTag, BkWewebElement);
    }
  }

  private collectBaseSource(): void {
    // 收集已加载的脚本和样式
  }
}

export default new WeWeb();
```

## 类型定义

```typescript
interface IStartOption {
  collectBaseSource?: boolean;
  fetchSource?: FetchSourceType;
  webComponentTag?: string;
}

type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
```

## 注意事项

### 1. 调用时机

`start` 应该在应用初始化时调用，且只调用一次：

```typescript
// ✅ 正确：在入口文件中调用
// main.ts
import weWeb from '@blueking/bk-weweb';
weWeb.start();

// ❌ 错误：多次调用
weWeb.start();
weWeb.start(); // 重复调用
```

### 2. 标签名限制

自定义标签名必须符合 Web Components 规范：

```typescript
// ✅ 正确：包含连字符
weWeb.start({ webComponentTag: 'my-app' });
weWeb.start({ webComponentTag: 'micro-frontend' });

// ❌ 错误：不包含连字符
// weWeb.start({ webComponentTag: 'myapp' });  // 无效
```

### 3. fetchSource 返回值

`fetchSource` 必须返回资源的文本内容：

```typescript
// ✅ 正确：返回文本
fetchSource: async url => {
  const response = await fetch(url);
  return response.text(); // 返回字符串
};

// ❌ 错误：返回 Response 对象
fetchSource: async url => {
  return fetch(url); // 错误
};
```

## 相关文档

- [快速上手](../getting-started/quick-start.md)
- [API 概述](./README.md)
