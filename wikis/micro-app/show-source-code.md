# showSourceCode · 显示源码

- 类型：`boolean`
- 默认值：`false`（微应用）
- 适用模式：微应用 / 微模块

`showSourceCode` 控制子应用执行脚本时是否**保留源码信息**。开启后，脚本以更接近原始形态的方式注入，便于在浏览器开发者工具中查看与断点调试；关闭时框架可能以更"内联/匿名"的方式执行脚本，源码定位较困难。

## 用法

```ts
import { loadApp } from '@blueking/bk-weweb';

await loadApp({
  url: 'http://localhost:8001/',
  id: 'app',
  showSourceCode: true, // 便于调试
});
```

标签用法：

```html
<bk-weweb id="app" url="http://localhost:8001/" showSourceCode></bk-weweb>
```

## 默认值差异

| 模式 | `showSourceCode` 默认 |
| --- | --- |
| 微应用 | `false` |
| [微模块](../micro-module/show-source-code) | `true` |

微模块默认开启，便于远程模块调试；微应用默认关闭。

## 何时使用

- 开发/联调阶段，需要在 DevTools 的 Sources 面板中定位子应用源码、打断点。
- 排查子应用脚本执行报错时，开启可获得更可读的堆栈。

## 注意事项

- 生产环境通常无需开启（微应用默认即关闭）。
- 该选项影响脚本注入方式，不改变功能行为。脚本执行机制详见 [资源解析原理](../principles/entry)。
