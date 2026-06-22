# WeWeb 类与 start

包的默认导出是一个 `WeWeb` 单例。导入 `@blueking/bk-weweb` 时，它会在构造阶段自动把自定义元素 `bk-weweb` 注册到 `window.customElements`。

```ts
import weWeb from '@blueking/bk-weweb';
```

## WeWeb 类

```ts
class WeWeb {
  fetchSource?: FetchSourceType;
  webComponentTag: string; // 默认 'bk-weweb'

  setWebComponentTag(): void;
  start(option?: IStartOption): void;
}
```

| 成员 | 说明 |
| --- | --- |
| `fetchSource` | 全局自定义资源获取方法，由 `start` 设置。见[自定义资源获取](../advanced/fetch-source) |
| `webComponentTag` | 当前自定义元素标签名，默认 `'bk-weweb'` |
| `setWebComponentTag()` | 按 `webComponentTag` 注册自定义元素（已注册同名则跳过） |
| `start(option?)` | 启动并应用配置选项 |

## start(option)

```ts
interface IStartOption {
  collectBaseSource?: boolean;          // 收集主应用资源供子应用共享
  fetchSource?: FetchSourceType;        // 全局自定义资源获取
  webComponentTag?: string;             // 自定义元素标签名
}

type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
```

`start` 的行为：

1. `collectBaseSource` 为真 → 调用 `collectBaseSource()` 开启[主应用资源共享](../advanced/base-source)；
2. `fetchSource` 为函数 → 设为全局资源获取方法；
3. 用 `webComponentTag`（缺省 `'bk-weweb'`）注册自定义元素。

### 示例

```ts
import weWeb from '@blueking/bk-weweb';

weWeb.start({
  collectBaseSource: true,
  webComponentTag: 'micro-frame',
  fetchSource: async (url, options) => {
    const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}` } });
    return res.text();
  },
});
```

> `start` 是可选的。若无需任何全局配置，只 `import '@blueking/bk-weweb'` 即可使用默认的 `<bk-weweb>` 标签与全部 Hooks API。

## 包导出一览

```ts
import weWeb, {
  // 生命周期
  load, loadApp, loadInstance,
  mount, unmount, activated, deactivated, unload,
  // 预加载
  preLoadApp, preLoadInstance, preLoadSource,
  // 枚举与类型
  WewebMode,
  type IAppModelProps, type IJsModelProps, type BaseModel,
} from '@blueking/bk-weweb';

// Vite 插件（子路径导出）
import wewebVitePlugin from '@blueking/bk-weweb/vite/helper';
```
