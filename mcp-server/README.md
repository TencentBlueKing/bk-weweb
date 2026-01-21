# BK-WeWeb MCP Server

为 BK-WeWeb 微前端框架提供 MCP (Model Context Protocol) 服务，让 AI 助手能够更好地帮助开发者使用 BK-WeWeb。

## 功能特性

- 📚 **文档查询**: 快速获取 BK-WeWeb 各模块的文档
- 🔧 **代码生成**: 生成微应用/微模块的配置和集成代码
- ✅ **配置校验**: 验证配置是否正确，提供优化建议
- 📖 **示例代码**: 获取各种使用场景的完整示例
- 🌐 **双模式支持**: 支持 SSE (HTTP) 和 Stdio 两种传输方式

## 安装与配置

### 方式一：使用 npx（推荐，无需安装）

直接在 Cursor 或 Claude Desktop 中配置，无需预先安装。

#### Cursor 配置

编辑 `~/.cursor/mcp.json`：

**Stdio 模式（推荐）**：

```json
{
  "mcpServers": {
    "bk-weweb": {
      "command": "npx",
      "args": ["-y", "-p", "@blueking/bk-weweb-mcp", "bk-weweb-mcp-stdio"]
    }
  }
}
```

**SSE 模式**：

```json
{
  "mcpServers": {
    "bk-weweb": {
      "command": "npx",
      "args": ["-y", "@blueking/bk-weweb-mcp"]
    }
  }
}
```

#### Claude Desktop 配置

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "bk-weweb": {
      "command": "npx",
      "args": ["-y", "-p", "@blueking/bk-weweb-mcp", "bk-weweb-mcp-stdio"]
    }
  }
}
```

### 方式二：本地开发安装

```bash
cd mcp-server
pnpm install
pnpm run build
```

**Stdio 模式**：

```json
{
  "mcpServers": {
    "bk-weweb": {
      "command": "node",
      "args": ["/path/to/bk-weweb/mcp-server/dist/stdio.js"]
    }
  }
}
```

**SSE 模式**（先运行 `pnpm start` 启动服务器）：

```json
{
  "mcpServers": {
    "bk-weweb": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

---

## 命令行使用

### SSE 模式（HTTP 服务器）

```bash
# 使用 npx
npx @blueking/bk-weweb-mcp

# 指定端口
PORT=8080 npx @blueking/bk-weweb-mcp

# 本地开发
pnpm start
```

启动后可访问：

- `http://localhost:3100/` - 服务器信息
- `http://localhost:3100/health` - 健康检查
- `http://localhost:3100/sse` - SSE 连接端点
- `http://localhost:3100/messages` - 消息处理端点

### Stdio 模式

```bash
# 使用 npx
npx -y -p @blueking/bk-weweb-mcp bk-weweb-mcp-stdio

# 本地开发
pnpm start:stdio
```

## 可用工具

### 文档查询

| 工具                 | 说明                    |
| -------------------- | ----------------------- |
| `list_bk_weweb_docs` | 列出所有可用文档主题    |
| `get_bk_weweb_docs`  | 获取特定主题的文档      |
| `get_api_reference`  | 获取特定 API 的详细文档 |

**支持的文档主题**:

- `introduction` - 简介
- `quick-start` - 快速上手
- `micro-app` - 微应用模式
- `micro-module` - 微模块模式
- `hooks` - Hooks API
- `api` - API 参考
- `preload` - 预加载
- `shadow-dom` - Shadow DOM
- `keep-alive` - 缓存模式

### 代码生成

| 工具                         | 说明                |
| ---------------------------- | ------------------- |
| `generate_micro_app_code`    | 生成微应用配置代码  |
| `generate_micro_module_code` | 生成微模块配置代码  |
| `generate_vue_integration`   | 生成 Vue 3 集成代码 |
| `generate_react_integration` | 生成 React 集成代码 |

### 配置校验

| 工具                          | 说明               |
| ----------------------------- | ------------------ |
| `validate_weweb_config`       | 校验配置是否正确   |
| `check_browser_compatibility` | 检查浏览器兼容性   |
| `get_cors_config`             | 获取 CORS 配置指南 |

### 示例代码

| 工具               | 说明                   |
| ------------------ | ---------------------- |
| `list_examples`    | 列出所有示例           |
| `get_example_code` | 获取特定场景的示例代码 |

**支持的示例场景**:

- `basic-app` - 基础微应用
- `basic-module` - 基础微模块
- `data-passing` - 数据传递
- `keep-alive` - KeepAlive 缓存
- `preload` - 预加载
- `shadow-dom` - Shadow DOM
- `scope-location` - 路由隔离
- `custom-container` - 自定义容器
- `multi-framework` - 多框架共存
- `error-handling` - 错误处理

## 使用示例

### 查询文档

```
请帮我查看 BK-WeWeb 的快速上手文档
```

### 生成代码

```
帮我生成一个 Vue 3 项目集成微应用的代码，应用 ID 是 dashboard，URL 是 http://localhost:8001/
```

### 校验配置

```
帮我检查这个配置是否正确：
{
  "url": "http://localhost:8001/",
  "id": "my-app",
  "scopeJs": true,
  "scopeCss": true
}
```

### 获取示例

```
给我一个 KeepAlive 缓存模式的完整示例
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式 (SSE)
pnpm dev

# 开发模式 (Stdio)
pnpm dev:stdio

# 构建
pnpm build

# 运行 SSE 服务器
pnpm start

# 运行 Stdio 服务器
pnpm start:stdio
```

## API 端点 (SSE 模式)

| 端点        | 方法 | 说明             |
| ----------- | ---- | ---------------- |
| `/`         | GET  | 服务器信息       |
| `/health`   | GET  | 健康检查         |
| `/sse`      | GET  | 建立 SSE 连接    |
| `/messages` | POST | 发送消息到服务器 |

## 环境变量

| 变量   | 默认值 | 说明           |
| ------ | ------ | -------------- |
| `PORT` | 3100   | SSE 服务器端口 |

## 许可证

MIT
