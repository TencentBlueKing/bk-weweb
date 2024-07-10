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

import type { DocumentEventListener } from '../typings';
// rewrite window funtion like settimeout setinterval ...
export function rewriteWindowFunction(fakeWindow: Window & any): Record<string, CallableFunction> {
  const windowEventLisenerMap = new Map<string, DocumentEventListener[]>();
  const intervalTimerList: ReturnType<typeof setInterval>[] = [];
  const rawWindow = window;
  const { addEventListener, clearInterval, removeEventListener, setInterval } = window;

  fakeWindow.addEventListener = (
    type: string,
    listener: DocumentEventListener,
    options?: AddEventListenerOptions | boolean,
  ): void => {
    windowEventLisenerMap.set(type, [...(windowEventLisenerMap.get(type) || []), listener]);
    addEventListener.call(rawWindow, type, listener, options);
  };
  fakeWindow.removeEventListener = (
    type: string,
    listener: DocumentEventListener,
    options?: AddEventListenerOptions | boolean,
  ): void => {
    const listenerList = windowEventLisenerMap.get(type);
    if (listenerList?.length) {
      const index = listenerList.indexOf(listener);
      index > -1 && listenerList.splice(index, 1);
    }
    removeEventListener.call(rawWindow, type, listener, options);
  };
  fakeWindow.setInterval = (
    handler: TimerHandler | string,
    timeout?: number | undefined,
    ...args: any[]
  ): ReturnType<typeof setInterval> => {
    const timer = setInterval.call(rawWindow, handler as any, timeout, ...(args as []));
    intervalTimerList.push(timer);
    return timer;
  };
  fakeWindow.clearInterval = (timer: ReturnType<typeof setInterval>) => {
    const index = intervalTimerList.indexOf(timer);
    index > -1 && intervalTimerList.splice(index, 1);
    clearInterval.call(rawWindow, timer as any);
  };
  // reset all event listener & interval & timeout when unmount app
  function resetWindowFunction() {
    // clear window events listener
    if (windowEventLisenerMap.size) {
      windowEventLisenerMap.forEach((listenerList, type) => {
        listenerList.forEach(listener => removeEventListener.call(rawWindow, type, listener));
      });
      windowEventLisenerMap.clear();
    }
    // clear settimeout timers
    if (intervalTimerList.length) {
      intervalTimerList.forEach(timer => {
        clearInterval.call(rawWindow, timer);
      });
    }
  }
  return {
    resetWindowFunction,
  };
}
