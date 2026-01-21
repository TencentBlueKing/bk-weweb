# keepAlive 属性（微模块）

## 概述

`keepAlive` 属性用于控制是否启用**缓存模式**。开启后，模块切换时保留状态，再次激活时恢复。

## 基本信息

| 属性     | 值                         |
| -------- | -------------------------- |
| 属性名   | `keepAlive` / `keep-alive` |
| 类型     | `boolean`                  |
| 是否必填 | 否                         |
| 默认值   | `false`                    |

## 使用方式

### Web Component

```html
<bk-weweb
  id="my-widget"
  mode="js"
  url="http://localhost:8002/widget.js"
  :keep-alive="true"
/>
```

### Hooks API

```typescript
import { loadInstance, activated, deactivated, WewebMode } from '@blueking/bk-weweb';

// 加载模块（开启 keepAlive）
await loadInstance({
  url: 'http://localhost:8002/widget.js',
  id: 'my-widget',
  mode: WewebMode.INSTANCE,
  keepAlive: true,
});

// 激活模块
activated('my-widget', document.getElementById('container'));

// 停用模块（保留状态）
deactivated('my-widget');

// 再次激活（恢复状态）
activated('my-widget', document.getElementById('container'));
```

## 使用场景

### 场景一：Tab 切换

```typescript
// 切换 Tab 时保留模块状态
function switchWidget(currentId: string, newId: string) {
  deactivated(currentId); // 保留状态
  activated(newId, container); // 激活新模块
}
```

### 场景二：表单模块

```typescript
// 用户填写表单后临时切换到其他模块
await loadInstance({
  url: 'http://localhost:8002/form-widget.js',
  id: 'form-widget',
  mode: WewebMode.INSTANCE,
  keepAlive: true, // 保留表单数据
});
```

## 类型定义

```typescript
interface IJsModelProps {
  /**
   * 是否启用缓存模式
   * @default false
   */
  keepAlive?: boolean;

  // ... 其他属性
}
```

## 相关 Hooks

- [activated](../hooks/activated.md) - 激活模块
- [deactivated](../hooks/deactivated.md) - 停用模块
