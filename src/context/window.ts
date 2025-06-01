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

// 扩展的 Window 类型
export type FakeWindow = Window & Record<string, unknown>;

/**
 * 重写 Window 对象的方法，实现事件监听器和定时器的管理
 * 用于微前端应用卸载时清理资源
 */
export function rewriteWindowFunction(fakeWindow: FakeWindow): Record<string, CallableFunction> {
  // 存储事件监听器映射
  const windowEventListenerMap = new Map<keyof WindowEventMap, EventListenerOrEventListenerObject[]>();
  // 存储定时器列表
  const intervalTimerList: number[] = [];
  const rawWindow = window;
  const { addEventListener, clearInterval, removeEventListener, setInterval } = window;

  // 重写 addEventListener 方法
  fakeWindow.addEventListener = <K extends keyof WindowEventMap>(
    type: K,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void => {
    windowEventListenerMap.set(type, [...(windowEventListenerMap.get(type) || []), listener]);
    addEventListener.call(rawWindow, type, listener, options);
  };

  // 重写 removeEventListener 方法
  fakeWindow.removeEventListener = <K extends keyof WindowEventMap>(
    type: K,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void => {
    const listenerList = windowEventListenerMap.get(type);
    if (listenerList?.length) {
      const index = listenerList.indexOf(listener);
      index > -1 && listenerList.splice(index, 1);
    }
    removeEventListener.call(rawWindow, type, listener, options);
  };

  // 重写 setInterval 方法
  fakeWindow.setInterval = (
    handler: TimerHandler | string,
    timeout?: number | undefined,
    ...args: unknown[]
  ): number => {
    const timer = setInterval(handler as TimerHandler, timeout, ...(args as []));
    intervalTimerList.push(timer as number);
    return timer as number;
  };

  // 重写 clearInterval 方法
  fakeWindow.clearInterval = (timer: number) => {
    const index = intervalTimerList.indexOf(timer);
    index > -1 && intervalTimerList.splice(index, 1);
    clearInterval.call(rawWindow, timer as unknown as NodeJS.Timeout);
  };

  /**
   * 重置窗口函数，清理所有事件监听器和定时器
   * 在应用卸载时调用
   */
  function resetWindowFunction() {
    // 清理窗口事件监听器
    if (windowEventListenerMap.size) {
      windowEventListenerMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          removeEventListener.call(rawWindow, type, listener);
        }
      });
      windowEventListenerMap.clear();
    }
    // 清理定时器
    if (intervalTimerList.length) {
      for (const timer of intervalTimerList) {
        clearInterval.call(rawWindow, timer);
      }
    }
  }

  return {
    resetWindowFunction,
  };
}
