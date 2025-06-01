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

const PROTOCOL_REGEX = /^((((ht|f)tps?)|file):)?\/\//;
const DATA_BLOB_REGEX = /^(data|blob):/;
const FILE_EXTENSION_REGEX = /\.(\w+)$/;
const JS_EXTENSION_REGEX = /\.js$/;
const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 使用 nextTask 函数将回调函数添加到下一个任务队列中执行
 * @param cb 回调函数
 * @returns Promise 对象，用于异步处理回调函数
 */
export const nextTask = (cb: () => void): Promise<void> => Promise.resolve().then(cb);

/**
 * 使用 nextTick 函数将回调函数添加到全局任务队列中执行
 * 如果已经有任务在等待执行，则不会重复添加任务
 * @param cb 回调函数
 */
let globalTaskPending = false;
export const nextTick = (cb: () => void): void => {
  if (globalTaskPending) return;

  globalTaskPending = true;
  nextTask(() => {
    cb();
    globalTaskPending = false;
  });
};

/**
 * 给 URL 添加协议头
 * @param url 要添加协议头的 URL
 * @returns 添加了协议头后的 URL
 */
export const addUrlProtocol = (url: string): string => {
  if (url.startsWith('//')) return `${location.protocol}${url}`;
  if (!url.startsWith('http')) return `${location.protocol}//${url}`;
  return url;
};

/**
 * 填充完整路径
 * @param path 路径
 * @param baseURI 基础路径
 * @returns 完整的URL路径
 */
export const fillUpPath = (path: string, baseURI: string): string => {
  if (!path || PROTOCOL_REGEX.test(path) || DATA_BLOB_REGEX.test(path)) {
    return path;
  }

  const { origin, pathname } = new URL(addUrlProtocol(baseURI));
  const basePath = `${origin}${pathname}`.replace(FILE_EXTENSION_REGEX, '/');
  return new URL(path, basePath).toString();
};

/**
 * 生成随机字符串
 * @param length 生成字符串的长度
 * @param chars 生成字符串的字符范围
 * @returns 随机字符串
 */
export const random = (length: number, chars: string = RANDOM_CHARS): string => {
  const charsLength = chars.length;
  return Array.from({ length }, () => chars[Math.floor(Math.random() * charsLength)]).join('');
};

/**
 * 生成随机URL
 * @returns 随机URL字符串
 */
export const randomUrl = (): string => `inline-${random(16)}`;

/**
 * requestIdleCallback polyfill
 */
export const requestIdleCallback =
  window.requestIdleCallback ??
  ((cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  });

/**
 * cancelIdleCallback polyfill
 */
export const cancelIdleCallback = window.cancelIdleCallback ?? ((id: number) => clearTimeout(id));

/**
 * 判断是否是JSONP请求
 * @param url 要检查的URL
 * @returns 是否为JSONP请求
 */
export const isJsonpUrl = (url: null | string): boolean => {
  if (!url) return false;

  try {
    const { pathname } = new URL(addUrlProtocol(url));
    return !JS_EXTENSION_REGEX.test(pathname);
  } catch {
    // URL 解析失败时，使用原始逻辑
    return !JS_EXTENSION_REGEX.test(url);
  }
};
