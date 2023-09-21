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
 * 使用 nextTask 函数将回调函数添加到下一个任务队列中执行。
 * @param cb 回调函数
 * @returns Promise 对象，用于异步处理回调函数
 */
export const nextTask: (cb: () => void) => any = cb => Promise.resolve().then(cb);

/**
 * 使用 nextTick 函数将回调函数添加到全局任务队列中执行。
 * 如果已经有任务在等待执行，则不会重复添加任务。
 * @param cb 回调函数
 */
let globalTaskPending = false;
export function nextTick(cb: () => void): void {
  if (!globalTaskPending) {
    globalTaskPending = true;
    nextTask(() => {
      cb();
      globalTaskPending = false;
    });
  }
}

/**
 * 给 URL 添加协议头
 * @param url 要添加协议头的 URL
 * @returns 添加了协议头后的 URL
 */
export function addUrlProtocol(url: string): string {
  if (url.startsWith('//')) return `${location.protocol}${url}`;
  if (!url.startsWith('http')) return `${location.protocol}//${url}`;
  return url;
}

/**
 *
 * @param path 路径
 * @param baseURI 基础路径
 * @returns
 */
export function fillUpPath(path: string, baseURI: string): string {
  if (!path || /^((((ht|f)tps?)|file):)?\/\//.test(path) || /^(data|blob):/.test(path)) return path;
  const { origin, pathname } = new URL(addUrlProtocol(baseURI));
  return new URL(path, `${origin}${pathname}`.replace(/\.(\w+)$/, '/')).toString();
}

/**
 * 生成随机url
 */
export function randomUrl(): string {
  return `inline-${random(16)}`;
}

/**
 * requestIdleCallback polyfill
 */
export const requestIdleCallback =
  window.requestIdleCallback ||
  function (cb: CallableFunction) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

/**
 * cancelIdleCallback polyfill
 */
export const cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id: number) {
    clearTimeout(id);
  };

/**
 *
 * @param n 生成字符串的长度
 * @param str 生成字符串的范围
 * @returns string
 */
export const random = (n: number, str = 'abcdefghijklmnopqrstuvwxyz0123456789') => {
  // 生成n位长度的字符串
  let result = '';
  for (let i = 0; i < n; i++) {
    result += str[parseInt((Math.random() * str.length).toString(), 10)];
  }
  return result;
};

/**
 *
 * @param url string
 * @returns boolean
 * @description 判断是否是jsonp请求
 */
export const isJsonpUrl = (url: null | string) => {
  if (!url) return false;
  if (url.match(/\.js$/)) return false;
  const { pathname } = new URL(addUrlProtocol(url));
  return !pathname.match(/\.js$/);
};
