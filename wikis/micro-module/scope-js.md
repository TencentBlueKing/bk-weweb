# scopeJs · JS 沙箱（微模块）

- 类型：`boolean`
- 默认值：`true`
- 适用模式：微模块

控制是否为微模块启用 JS 沙箱。`MicroInstanceModel` 构造时 `this.scopeJs = props.scopeJs ?? true`，即**默认开启**；开启后创建 `SandBox` 代理全局对象，隔离模块的全局副作用。

## 用法

```ts
import { loadInstance, mount } from '@blueking/bk-weweb';

// 默认开启沙箱
await loadInstance({ url, id: 'm1' });

// 关闭沙箱
await loadInstance({ url, id: 'm2', scopeJs: false });
```

标签用法（微模块的 `scopeJs` 按常规布尔属性解析，**不像微应用那样取反**）：

```html
<!-- 关闭沙箱 -->
<bk-weweb id="m" mode="js" url="..." scopeJs="false"></bk-weweb>
```

> 标签微模块模式下源码为 `scopeJs: getBooleanAttr('scopeJs')`：不写该属性时为 `undefined`，经构造函数 `?? true` 后默认开启；写 `scopeJs="false"` 则关闭。与微应用标签的取反行为不同。

## 何时关闭

- 模块需要直接访问主应用的全局单例（如共享的状态管理实例）。
- 模块体积小、可信，且确认无全局污染风险。

## 注意事项

关闭沙箱后模块对全局对象的修改会直接作用于主应用。若多个微模块共存，关闭隔离可能引发相互干扰，请谨慎。沙箱原理见 [沙箱实现](../principles/sandbox)。
