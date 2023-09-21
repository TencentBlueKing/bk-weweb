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

import { DocumentEventListener } from '../typings';
import { getCurrentRunningApp } from './cache';
// rewrite document and body event listener
export function rewriteDocumentAndBodyEvent(): { resetDocumentAndBodyEvent: () => void } {
  const { addEventListener, removeEventListener } = window.document;
  const { addEventListener: bodyAddEventListener, removeEventListener: bodyRemoveEventListener } = window.document.body;
  const documentListenerMap = new Map<keyof DocumentEventMap, DocumentEventListener[]>();
  document.addEventListener = function <K extends keyof DocumentEventMap>(
    type: K,
    listener: DocumentEventListener,
    options?: AddEventListenerOptions | boolean | undefined,
  ): void {
    const app = getCurrentRunningApp();
    if (app?.keepAlive) {
      const listeners = documentListenerMap.get(type) || [];
      documentListenerMap.set(type, [...listeners, listener]);
    }
    addEventListener.call(app?.container instanceof ShadowRoot ? app.container : this, type, listener, options);
  };
  document.body.addEventListener = document.addEventListener;

  document.removeEventListener = function <K extends keyof DocumentEventMap>(
    type: K,
    listener: DocumentEventListener,
    options?: AddEventListenerOptions | boolean,
  ): void {
    const app = getCurrentRunningApp();
    if (app?.keepAlive) {
      const listeners = documentListenerMap.get(type) || [];
      if (listeners.length && listeners.some(l => l === listener)) {
        listeners.splice(listeners.indexOf(listener), 1);
      }
    }
    removeEventListener.call(app?.container instanceof ShadowRoot ? app.container : this, type, listener, options);
  };
  document.body.removeEventListener = document.removeEventListener;

  function resetDocumentAndBodyEvent(): void {
    const app = getCurrentRunningApp();
    if (app?.keepAlive && documentListenerMap.values()) {
      Array.from(documentListenerMap.entries()).forEach(([type, listeners]) => {
        listeners?.forEach(listener => {
          document.removeEventListener.call(document, type, listener);
        });
      });
    }
    document.addEventListener = addEventListener;
    document.body.addEventListener = bodyAddEventListener;
    document.removeEventListener = removeEventListener;
    document.body.removeEventListener = bodyRemoveEventListener;
    documentListenerMap.clear();
  }
  return {
    resetDocumentAndBodyEvent,
  };
}
