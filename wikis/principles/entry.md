# 资源解析

子应用的资源拉取与解析由 `EntrySource`（`entry/entry.ts`）统一负责，配合 `Script`（`entry/script.ts`）、`Style`（`entry/style.ts`）完成脚本与样式的收集、改写与执行。

## EntrySource 结构

```ts
class EntrySource {
  html: HTMLElement | null;          // 微应用：解析后的内容容器
  rawHtml?: string;                  // 原始 HTML 文本
  scripts: Map<string, Script>;      // 收集到的脚本
  styles: Map<string, Style>;        // 收集到的样式
  constructor(public url: string) {}
}
```

入口统一从 `importEntry(app)` 进入，按模型类型分流：微应用走 `importHtmlEntry`，微模块走 `importInstanceEntry`。两者都会先 `loadInitialSources` 处理 `initSource` 指定的额外资源。

## 微应用：HTML 入口解析

`importHtmlEntry` 的流程：

1. **拉取 HTML**：`fetchHtmlContent` 先查缓存（`appCache.getCacheHtml`），未命中则用 [`fetchSource`](../advanced/fetch-source) 请求（`{ cache: 'no-cache' }`）。
2. **创建包裹元素**：`createWrapElement` 去掉 `<head>`/`<body>` 标签后，把 HTML 写入一个 `<div>` 的 `innerHTML`。
3. **收集脚本与样式**：`collectScriptAndStyle` 依次处理 link / style / script / meta / img。
4. **执行样式**：`executeAppStyles` 注入并按作用域改写样式。
5. 解析结果存入 `this.html`，挂载时克隆该内容到容器。

### 收集规则

`collectScriptAndStyle` 对各类节点的处理：

| 节点 | 处理 |
| --- | --- |
| `<link rel="stylesheet">` | 转为 `Style` 实例，原节点替换为注释占位 |
| `<link rel="icon/prefetch/...">` | 移除（替换为注释） |
| 其它 `<link href>` | 用 `fillUpPath` 补全为绝对路径 |
| `<style>` | 文本转为 `Style` 实例并移除原节点 |
| `<script src>` | 转为外链 `Script`，原节点替换为注释 |
| 内联 `<script>` | 文本转为 `Script`（以随机串为键） |
| `<meta>` | 移除 |
| `<img src>` | 用 `fillUpPath` 补全路径 |

特殊属性：

- `exclude`：脚本/样式被移除（替换为注释）。
- `ignore`：保留原节点不处理。

脚本类型限定为 `text/javascript`、`application/javascript`、`module` 等；带不支持 `type` 的脚本会被忽略。`type="module"` 的脚本 `isModule = true`、`defer = true`。

## 微模块：JS 入口解析

`importInstanceEntry` 更简单：

1. `fetchJsContent` 先查脚本缓存（`appCache.getCacheScript`），未命中则 `fetchSource` 拉取 JS 文本。
2. 用整段 JS 文本构造一个 `Script` 实例存入 `scripts`（以入口 url 为键），`isModule` 取决于 url 是否以 `.ts` 结尾。

挂载时执行该脚本，取其导出对象调用 `render`（见 [render 导出规范](../micro-module/render-specification)）。

## 路径补全

子应用资源常使用相对路径。`fillUpPath(path, baseUrl)` 会把相对路径补全为基于子应用入口 URL 的绝对路径，确保脚本、样式、图片在主应用域下仍能正确加载。

## 资源缓存与共享

- `EntrySource` 自身的 `scripts` / `styles` 为该应用的资源集合。
- `AppCache` 提供跨应用查找：`getCacheScript` / `getCacheStyle` 会先查主应用 `baseSource`（见[主应用资源共享](../advanced/base-source)），再查其它应用缓存，命中即复用，减少重复请求。

## 样式作用域改写

`Style` 与 `executeAppStyles` 负责把样式注入容器，并在开启 [`scopeCss`](../micro-app/scope-css) 时按容器 `id`（应用 `name`）为规则追加作用域前缀，使样式只在子应用容器内生效；启用 Shadow DOM 时则交由 Shadow 边界天然隔离。

## 小结

资源解析的核心思想是：**把入口 HTML/JS 拉取下来 → 提取其中的脚本与样式 → 用占位注释替换原节点 → 在受控时机、受控环境（沙箱）中执行脚本、注入并隔离样式**。这样既保留了子应用的资源结构，又让框架能完全掌控其执行与隔离。
