# load

## 概述

`load` 是 BK-WeWeb 的**统一加载入口函数**，根据传入的 `mode` 参数自动选择加载微应用或微模块。

## 函数签名

```typescript
function load(props: IBaseModelProps): Promise<BaseModel>;
```

## 参数

### IBaseModelProps

| 参数          | 类型              | 必填   | 默认值          | 说明               |
| ------------- | ----------------- | ------ | --------------- | ------------------ |
| `url`         | `string`          | **是** | -               | 入口 URL           |
| `id`          | `string \| null`  | 否     | -               | 应用/模块标识符    |
| `mode`        | `WewebMode`       | 否     | `WewebMode.APP` | 运行模式           |
| `isPreLoad`   | `boolean`         | 否     | `false`         | 是否预加载         |
| `fetchSource` | `FetchSourceType` | 否     | -               | 自定义资源获取函数 |

### WewebMode 枚举

```typescript
enum WewebMode {
  APP = 'app', // 微应用模式
  INSTANCE = 'js', // 微模块模式
  CONFIG = 'config', // 配置模式（保留）
}
```

## 返回值

```typescript
Promise<BaseModel>;
```

返回加载后的模型实例，根据 `mode` 不同返回不同类型：

- `mode: 'app'` → `MicroAppModel`
- `mode: 'js'` → `MicroInstanceModel`

## 使用示例

### 基础用法

```typescript
import { load, WewebMode } from '@blueking/bk-weweb';

// 加载微应用
const app = await load({
  url: 'http://localhost:8001/',
  id: 'my-app',
  mode: WewebMode.APP,
});

// 加载微模块
const module = await load({
  url: 'http://localhost:8002/widget.js',
  id: 'my-module',
  mode: WewebMode.INSTANCE,
});
```

### 完整配置

```typescript
import { load, WewebMode } from '@blueking/bk-weweb';

// 微应用完整配置
const app = await load({
  url: 'http://localhost:8001/',
  id: 'dashboard',
  mode: WewebMode.APP,
  scopeJs: true,
  scopeCss: true,
  scopeLocation: true,
  keepAlive: true,
  showSourceCode: false,
  data: {
    userId: '12345',
    token: 'xxx',
  },
  initSource: ['https://cdn.example.com/vue.min.js'],
});

// 微模块完整配置
const module = await load({
  url: 'http://localhost:8002/chart.js',
  id: 'chart-widget',
  mode: WewebMode.INSTANCE,
  container: document.getElementById('container'),
  scopeJs: true,
  scopeCss: true,
  keepAlive: false,
  data: {
    chartType: 'line',
  },
});
```

### 动态选择模式

```typescript
import { load, WewebMode } from '@blueking/bk-weweb';

interface AppConfig {
  url: string;
  id: string;
  type: 'app' | 'module';
}

async function loadDynamicApp(config: AppConfig) {
  return await load({
    url: config.url,
    id: config.id,
    mode: config.type === 'app' ? WewebMode.APP : WewebMode.INSTANCE,
  });
}

// 根据配置动态加载
const apps: AppConfig[] = [
  { url: 'http://app.example.com/', id: 'main-app', type: 'app' },
  { url: 'http://cdn.example.com/widget.js', id: 'widget', type: 'module' },
];

for (const config of apps) {
  await loadDynamicApp(config);
}
```

## 内部实现

```typescript
export async function load(props: IBaseModelProps): Promise<BaseModel> {
  beforeLoad();

  if (props.mode === WewebMode.INSTANCE) {
    return await loadInstance(props);
  }

  return await loadApp(props);
}
```

`load` 函数内部根据 `mode` 参数调用对应的专用加载函数：

- `mode: 'app'` → 调用 `loadApp()`
- `mode: 'js'` → 调用 `loadInstance()`

## 错误处理

```typescript
import { load, WewebMode } from '@blueking/bk-weweb';

try {
  const app = await load({
    url: 'http://localhost:8001/',
    id: 'my-app',
    mode: WewebMode.APP,
  });
  console.log('加载成功:', app);
} catch (error) {
  console.error('加载失败:', error);
  // 常见错误：
  // - 网络错误
  // - CORS 错误
  // - 资源解析错误
}
```

## 与专用函数的关系

| 函数           | 说明       | 推荐场景         |
| -------------- | ---------- | ---------------- |
| `load`         | 统一入口   | 动态决定加载类型 |
| `loadApp`      | 加载微应用 | 明确加载微应用   |
| `loadInstance` | 加载微模块 | 明确加载微模块   |

如果你已经确定要加载的类型，推荐直接使用 `loadApp` 或 `loadInstance`，可以获得更好的类型推导。

## 类型定义

```typescript
interface IBaseModelProps {
  url: string;
  id?: string | null;
  mode?: WewebMode;
  isPreLoad?: boolean;
  fetchSource?: FetchSourceType;
}

interface BaseModel {
  readonly appCacheKey: string;
  container?: ContainerType;
  name: string;
  url: string;
  data: Record<string, unknown>;
  isPreLoad: boolean;
  keepAlive?: boolean;
  scopeJs: boolean;
  scopeCss?: boolean;
  showSourceCode?: boolean;
  source?: EntrySource;
  sandBox?: SandBox;

  activated<T>(container: ContainerType, callback?: CallbackFunction<T>): void;
  deactivated(): void;
  mount<T>(container?: ContainerType, callback?: CallbackFunction<T>): void;
  onError(): void;
  onMount(): void;
  registerRunningApp(): void;
  start(): Promise<void>;
  unmount(needDestroy?: boolean): void;

  get status(): ValueOfAppState;
  set status(value: ValueOfAppState);
}
```

## 相关函数

- [loadApp](./load-app.md) - 加载微应用
- [loadInstance](./load-instance.md) - 加载微模块
- [mount](./mount.md) - 挂载
