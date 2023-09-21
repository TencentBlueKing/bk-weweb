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
import { appCache } from '../cache/app-cache';
import { fillUpPath } from '../utils/common';
import { elementInsertHandler, elmentAppendHandler, isSepcailElement } from '../utils/element';
import { setCurrentRunningApp } from './cache';

const { setAttribute } = Element.prototype;

const { append, appendChild: bodyAppendChild, removeChild: bodyRemoveChild } = HTMLBodyElement.prototype;
const {
  appendChild: headAppendChild,
  insertBefore: headInsertBefore,
  removeChild: headRemoveChild,
} = HTMLHeadElement.prototype;
const rawHead = document.head;
let hasRewrite = false;
export function rewriteBodyAndHeaderMethods(): void {
  if (hasRewrite) return;
  hasRewrite = true;
  Element.prototype.setAttribute = function (key: string, value: string): void {
    const tagName = this.tagName.toLocaleUpperCase();
    if (
      ((['src', 'srcset'].includes(key) && ['IMG', 'SCRIPT'].includes(tagName)) ||
        (key === 'href' && ['LINK'].includes(tagName))) &&
      this.__BK_WEWEB_APP_KEY__ &&
      appCache.getApp(this.__BK_WEWEB_APP_KEY__ || '')
    ) {
      setAttribute.call(this, key, fillUpPath(value, appCache.getApp(this.__BK_WEWEB_APP_KEY__!)!.url));
    } else {
      setAttribute.call(this, key, value);
    }
  };
  HTMLBodyElement.prototype.appendChild = function appendChildNew<T extends Node>(newChild: T): T {
    if (newChild.__KEEP_ALIVE__ && isSepcailElement(newChild)) return (headAppendChild as any).call(rawHead, newChild);
    return elmentAppendHandler(this, newChild, bodyAppendChild);
  };
  HTMLBodyElement.prototype.append = function <T extends Node>(...nodes: T[]): void {
    nodes.forEach(node => {
      // keepalive link script style set in head
      if (node.__KEEP_ALIVE__ && isSepcailElement(node)) {
        return (headAppendChild as any).call(rawHead, node);
      }
      elmentAppendHandler(this, node as Node, bodyAppendChild);
    });
  };
  HTMLHeadElement.prototype.appendChild = HTMLBodyElement.prototype.appendChild;

  HTMLHeadElement.prototype.insertBefore = function <T extends Node>(newChild: T, refChild: Node | null): T {
    return elementInsertHandler(this, newChild, refChild, headInsertBefore);
  };
  HTMLBodyElement.prototype.removeChild = function removeChildNew<T extends Node>(oldChild: T): T {
    const app = appCache.getApp(oldChild.__BK_WEWEB_APP_KEY__!);
    if (app?.container?.contains(oldChild)) {
      const node = bodyRemoveChild.call(app.container, oldChild) as T;
      return node;
    }
    if (this.contains(oldChild)) {
      return bodyRemoveChild.call(this, oldChild) as T;
    }
    return oldChild;
  };
  HTMLHeadElement.prototype.removeChild = HTMLBodyElement.prototype.removeChild;
}

export function resetBodyAndHeaderMethods(): void {
  setCurrentRunningApp(null);
  Element.prototype.setAttribute = setAttribute;
  HTMLBodyElement.prototype.appendChild = bodyAppendChild;
  HTMLBodyElement.prototype.append = append;
  HTMLBodyElement.prototype.removeChild = bodyRemoveChild;
  HTMLHeadElement.prototype.appendChild = headAppendChild;
  HTMLHeadElement.prototype.insertBefore = headInsertBefore;
  HTMLHeadElement.prototype.removeChild = headRemoveChild;
  hasRewrite = false;
}
