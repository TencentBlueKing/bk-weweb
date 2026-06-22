# showSourceCode · 显示源码（微模块）

- 类型：`boolean`
- 默认值：`true`
- 适用模式：微模块

控制微模块脚本执行时是否保留源码信息以便调试。`MicroInstanceModel` 构造时 `this.showSourceCode = props.showSourceCode ?? true`，**默认开启**（与微应用默认关闭相反）。

## 用法

```ts
import { loadInstance } from '@blueking/bk-weweb';

// 默认开启，DevTools 可查看模块源码
await loadInstance({ url, id: 'm1' });

// 关闭
await loadInstance({ url, id: 'm2', showSourceCode: false });
```

标签用法：

```html
<bk-weweb id="m" mode="js" url="..." showSourceCode="false"></bk-weweb>
```

## 为什么微模块默认开启

微模块多用于远程加载第三方/跨团队组件，调试需求更高，因此默认保留源码，方便在浏览器 Sources 面板定位与断点。

## 注意事项

该选项只影响脚本注入方式，不改变模块功能。脚本执行机制见 [资源解析原理](../principles/entry)。
