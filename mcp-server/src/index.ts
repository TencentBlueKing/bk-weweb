#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-misused-promises */
/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
/**
 * BK-WeWeb MCP Server - SSE 模式入口
 *
 * 为 BK-WeWeb 微前端框架提供 MCP (Model Context Protocol) 服务
 * 使用 SSE (Server-Sent Events) 传输协议
 */

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';

import { createMcpServer, SERVER_NAME, SERVER_VERSION } from './server.js';

// 默认端口
const DEFAULT_PORT = 3100;

// 会话信息接口
interface SessionInfo {
  transport: SSEServerTransport;
  secret: string;
}

// 存储活跃的会话（包含 transport 和安全 secret）
const sessions: Map<string, SessionInfo> = new Map();

/**
 * 生成安全的随机 secret token
 */
function generateSecureSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 安全比较两个字符串（防止时序攻击）
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * 启动 SSE 服务器
 */
async function main() {
  const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

  const app = express();

  // CORS 中间件（包含 X-Session-Secret header 支持）
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Session-Secret');
    res.header('Access-Control-Expose-Headers', 'X-Session-Secret');
    next();
  });

  // 处理 OPTIONS 预检请求
  app.options('*', (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  // 注意：不要在 /messages 路由上使用 express.json()
  // SSEServerTransport.handlePostMessage 需要读取原始请求体流
  const jsonParser = express.json();
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 跳过 /messages 路由的 JSON 解析
    if (req.path === '/messages') {
      return next();
    }
    return jsonParser(req, res, next);
  });

  // 健康检查端点
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      server: SERVER_NAME,
      version: SERVER_VERSION,
      transport: 'sse',
    });
  });

  // 服务器信息端点
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      description: 'MCP Server for BK-WeWeb micro-frontend framework',
      transport: 'sse',
      endpoints: {
        sse: '/sse',
        messages: '/messages',
        health: '/health',
      },
    });
  });

  // SSE 端点 - 建立 SSE 连接
  app.get('/sse', async (_req: Request, res: Response) => {
    console.log('New SSE connection request');

    // 创建 SSE 传输
    const transport = new SSEServerTransport('/messages', res);

    // 使用 transport 自己的 sessionId
    const sessionId = transport.sessionId;

    // 生成安全的 session secret
    const secret = generateSecureSecret();

    // 存储会话信息
    sessions.set(sessionId, { transport, secret });
    console.log(`SSE connection established: ${sessionId}`);

    // 通过 SSE 发送 secret 给客户端（仅在建立连接时发送一次）
    res.write(`event: session-secret\ndata: ${JSON.stringify({ secret })}\n\n`);

    // 连接关闭时清理
    res.on('close', () => {
      console.log(`SSE connection closed: ${sessionId}`);
      sessions.delete(sessionId);
    });

    // 创建新的 MCP 服务器实例（每个连接一个）
    const server = createMcpServer();

    // 连接服务器到传输
    await server.connect(transport);
  });

  // 消息端点 - 接收客户端消息（带安全验证）
  app.post('/messages', async (req: Request, res: Response) => {
    // 从查询参数获取 sessionId
    const sessionId = req.query.sessionId as string;
    // 从请求头获取 session secret
    const clientSecret = req.headers['x-session-secret'] as string;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId parameter' });
      return;
    }

    if (!clientSecret) {
      res.status(401).json({ error: 'Missing session secret' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // 安全验证 session secret（防止会话劫持）
    if (!secureCompare(clientSecret, session.secret)) {
      console.warn(`Invalid session secret attempt for session: ${sessionId}`);
      res.status(403).json({ error: 'Invalid session secret' });
      return;
    }

    await session.transport.handlePostMessage(req, res);
  });

  // 启动服务器
  app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   BK-WeWeb MCP Server                          ║
║                                                                ║
║  Transport: SSE (Server-Sent Events)                           ║
║  Port: ${port}                                                   ║
║                                                                ║
║  Endpoints:                                                    ║
║    - GET  /         Server info                                ║
║    - GET  /health   Health check                               ║
║    - GET  /sse      SSE connection                             ║
║    - POST /messages Message handler                            ║
║                                                                ║
║  Ready to accept connections!                                  ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
