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
const ELEMENT_TARGET_NAME = ['currentTarget', 'srcElement', 'target'];
/**
 *
 * @param event
 * @param element
 * @returns {Event} event
 * @description 为事件对象添加 element 属性
 */
export function defineEventSourceElement(element: HTMLLinkElement | HTMLScriptElement, eventName = 'custom'): Event {
  return Object.defineProperties(
    new CustomEvent(eventName),
    ELEMENT_TARGET_NAME.reduce<Record<PropertyKey, any>>((props, name) => {
      props[name] = {
        get() {
          return element;
        },
      };
      return props;
    }, {}),
  );
}
/**
 *
 * @param element HTMLLinkElement | HTMLScriptElement
 * @description 触发 link 或者 script 的 onload 事件
 */
export function dispatchLinkOrScriptLoad(element: HTMLLinkElement | HTMLScriptElement): void {
  const event = defineEventSourceElement(element, 'load');
  if (typeof element.onload === 'function') {
    element.onload!(event);
    return;
  }
  element.dispatchEvent(event);
}
/**
 *
 * @param element HTMLLinkElement | HTMLScriptElement
 * @description 触发 link 或者 script 的 onerror 事件
 */
export function dispatchLinkOrScriptError(element: HTMLLinkElement | HTMLScriptElement): void {
  const event = defineEventSourceElement(element, 'error');
  if (typeof element.onerror === 'function') {
    element.onerror!(event);
    return;
  }
  element.dispatchEvent(event);
}
