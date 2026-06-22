# keepAlive · 缓存模式

- 类型：`boolean`
- 默认值：`false`
- 适用模式：微应用 / 微模块

`keepAlive` 控制子应用在"离开"时是否**保留 DOM 与运行状态**。开启后，切走子应用不会销毁它，再次进入可瞬时恢复，类似 Vue 的 `<keep-alive>`。

## 工作机制

`keepAlive` 改变的是失活时的行为：

- [`deactivated(appKey)`](../hooks/deactivated)：
  - `keepAlive: true` → 调用实例 `deactivated()`，状态置为 `DEACTIVATED`，**保留 DOM**，沙箱进入失活态。
  - `keepAlive: false` → 等价于 `unmount`，清空容器。
- [`activated(appKey, container)`](../hooks/activated)：
  - 若实例处于 `DEACTIVATED` 且 `keepAlive` → 把保留的节点转移到新容器、恢复沙箱，**不重新执行脚本**。
  - 否则 → 退化为常规 `mount`。

标签用法下，元素从 DOM 移除（`disconnectedCallback`）时也遵循该规则：`keepAlive` 为真则 `deactivated`，否则 `unmount`。

## 用法

需要成对使用 `activated` / `deactivated` 才能发挥 KeepAlive 的价值：

```ts
import { loadApp, activated, deactivated } from '@blueking/bk-weweb';

// 加载时开启 keepAlive
await loadApp({ url: 'http://localhost:8001/', id: 'list', keepAlive: true });

// 进入页面
activated('list', containerEl);

// 离开页面：保留状态
deactivated('list');

// 再次进入：秒级恢复，表单、滚动位置、运行状态都还在
activated('list', containerEl);
```

标签用法：

```html
<bk-weweb id="list" url="http://localhost:8001/" keepAlive></bk-weweb>
```

## 何时使用

- 列表 ↔ 详情来回切换，希望返回时保留列表滚动位置与筛选条件。
- 子应用初始化成本高，频繁重建代价大。

## 注意事项

- KeepAlive 会**常驻内存**保留 DOM 与状态，不再使用时应通过 [`unmount`](../hooks/unmount) + [`unload`](../hooks/unload) 释放。
- 若只用 `mount` / `unmount` 而不用 `activated` / `deactivated`，`keepAlive` 不会产生保留效果。
