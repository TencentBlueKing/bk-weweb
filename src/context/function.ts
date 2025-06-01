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

// 匹配类定义的正则
const CLASS_REGEX = /^class\b/;

// 匹配构造函数的正则（以大写字母开头的function）
const COMMON_CONSTRUCT_FU_REGEX = /^function\b\s[A-Z].*/;

// 缓存构造函数判断结果
const ConstructFunCacheMap = new WeakMap<CallableFunction, boolean>();

/**
 * 判断是否为构造函数
 */
export function isConstructFun(fn: CallableFunction) {
  if (fn.prototype?.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1) {
    return true;
  }

  if (ConstructFunCacheMap.has(fn)) {
    return ConstructFunCacheMap.get(fn);
  }

  const constructable = COMMON_CONSTRUCT_FU_REGEX.test(fn.toString()) || CLASS_REGEX.test(fn.toString());
  ConstructFunCacheMap.set(fn, constructable);
  return constructable;
}

// 存储函数绑定关系的映射
const functionBoundedValueMap = new WeakMap<CallableFunction, CallableFunction>();

/**
 * 绑定函数到原始window
 */
export default function bindFunctionToRawWindow(rawWindow: Window, value: unknown): unknown {
  if (functionBoundedValueMap.has(value as CallableFunction)) {
    return functionBoundedValueMap.get(value as CallableFunction);
  }

  if (typeof value === 'function' && !isConstructFun(value)) {
    const boundValue = Function.prototype.bind.call(value, rawWindow);

    for (const key in value) {
      boundValue[key] = value[key];
    }

    if (Object.hasOwn(value, 'prototype') && !Object.hasOwn(boundValue, 'prototype')) {
      Object.defineProperty(boundValue, 'prototype', {
        enumerable: false,
        value: value.prototype,
        writable: true,
      });
    }

    if (typeof value.toString === 'function') {
      const valueHasInstanceToString = Object.hasOwn(value, 'toString') && !Object.hasOwn(boundValue, 'toString');
      const boundValueHasPrototypeToString = boundValue.toString === Function.prototype.toString;

      if (valueHasInstanceToString || boundValueHasPrototypeToString) {
        const originToStringDescriptor = Object.getOwnPropertyDescriptor(
          valueHasInstanceToString ? value : Function.prototype,
          'toString',
        );

        Object.defineProperty(boundValue, 'toString', {
          ...originToStringDescriptor,
          ...(originToStringDescriptor?.get ? null : { value: () => value.toString() }),
        });
      }
    }

    functionBoundedValueMap.set(value, boundValue);
    return boundValue;
  }

  return value;
}
