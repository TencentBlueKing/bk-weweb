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

// 事件目标属性名称列表
const ELEMENT_TARGET_NAMES = ['currentTarget', 'srcElement', 'target'] as const;

type SupportedElement = HTMLLinkElement | HTMLScriptElement;

type PropertyDescriptors = Record<string, PropertyDescriptor>;

/** 为事件对象添加元素属性 */
export const defineEventSourceElement = (element: SupportedElement, eventName = 'custom'): Event => {
  const targetProperties: PropertyDescriptors = ELEMENT_TARGET_NAMES.reduce((properties, targetName) => {
    properties[targetName] = {
      get: () => element,
      enumerable: true,
      configurable: true,
    };
    return properties;
  }, {} satisfies PropertyDescriptors);

  return Object.defineProperties(new CustomEvent(eventName), targetProperties);
};

/** 触发link或script元素的onload事件 */
export const dispatchLinkOrScriptLoad = (element: SupportedElement): void => {
  const loadEvent = defineEventSourceElement(element, 'load');

  if (typeof element.onload === 'function') {
    element.onload.call(element, loadEvent);
    return;
  }
  element.dispatchEvent(loadEvent);
};

/** 触发link或script元素的onerror事件 */
export const dispatchLinkOrScriptError = (element: SupportedElement): void => {
  const errorEvent = defineEventSourceElement(element, 'error');

  if (typeof element.onerror === 'function') {
    element.onerror.call(element, errorEvent);
    return;
  }
  element.dispatchEvent(errorEvent);
};
