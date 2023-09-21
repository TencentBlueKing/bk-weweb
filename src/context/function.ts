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
/* eslint-disable max-len */
/* eslint-disable no-prototype-builtins */
/*
inspired by https://github.com/umijs/qiankun
*/
// 正则表达式，用于匹配类定义
const CLASS_REGEX = /^class\b/;

// 正则表达式，用于匹配以大写字母开头的函数定义
const COMMON_CONTRUCT_FU_REGEX = /^function\b\s[A-Z].*/;

// WeakMap 对象，用于缓存构造函数是否可实例化的结果
const ConstructFunCacheMap = new WeakMap<FunctionConstructor | any, boolean>();

/**
 * 判断一个函数是否可实例化
 * @param fn - 要判断的函数
 * @returns 可实例化返回 true，否则返回 false
 */
export function isConstructFun(fn: () => FunctionConstructor | any) {
  // 如果函数的原型的构造函数等于函数本身，并且原型对象上有超过一个属性，则认为是可实例化的
  if (fn.prototype?.constructor === fn && Object.getOwnPropertyNames(fn.prototype).length > 1) {
    return true;
  }

  // 如果在缓存中已经存在该函数的判断结果，则直接返回
  if (ConstructFunCacheMap.has(fn)) {
    return ConstructFunCacheMap.get(fn);
  }

  // 使用正则表达式测试函数的字符串表示，判断是否可实例化
  const constructable = COMMON_CONTRUCT_FU_REGEX.test(fn.toString()) || CLASS_REGEX.test(fn.toString());

  // 将判断结果保存到缓存中
  ConstructFunCacheMap.set(fn, constructable);

  return constructable;
}

// 创建一个弱映射，用于存储函数和其绑定版本之间的关系
const functionBoundedValueMap = new WeakMap<CallableFunction, CallableFunction>();

// 导出默认函数，用于将给定的值绑定到原始窗口对象
export default function bindFunctionToRawWindow(rawWindow: Window, value: any): unknown {
  // 如果值已经存在于映射中，直接返回与该值相关联的绑定版本
  if (functionBoundedValueMap.has(value)) {
    return functionBoundedValueMap.get(value);
  }
  // 如果值是一个函数且不是构造函数
  if (typeof value === 'function' && !isConstructFun(value)) {
    // 创建一个绑定到原始窗口对象的函数
    const boundValue = Function.prototype.bind.call(value, rawWindow);
    // 将原始函数的属性复制到绑定版本上
    for (const key in value) {
      boundValue[key] = value[key];
    }
    // 如果原始函数拥有原型并且绑定版本没有原型
    if (value.hasOwnProperty('prototype') && !boundValue.hasOwnProperty('prototype')) {
      // 将原始函数的原型属性设置到绑定版本上
      Object.defineProperty(boundValue, 'prototype', { enumerable: false, value: value.prototype, writable: true });
    }
    // 如果原始函数拥有 toString 方法
    if (typeof value.toString === 'function') {
      // 检查原始函数是否拥有 toString 属性，且绑定版本没有该属性
      const valueHasInstanceToString = value.hasOwnProperty('toString') && !boundValue.hasOwnProperty('toString');
      // 检查绑定版本的 toString 是否与 Function.prototype.toString 相同
      const boundValueHasPrototypeToString = boundValue.toString === Function.prototype.toString;

      // 如果原始函数的 toString 属性需要继承
      if (valueHasInstanceToString || boundValueHasPrototypeToString) {
        // 获取原始 toString 属性的描述符
        const originToStringDescriptor = Object.getOwnPropertyDescriptor(
          valueHasInstanceToString ? value : Function.prototype,
          'toString',
        );

        // 将绑定版本的 toString 属性设置为与原始函数相同的方法
        Object.defineProperty(boundValue, 'toString', {
          ...originToStringDescriptor,
          ...(originToStringDescriptor?.get ? null : { value: () => value.toString() }),
        });
      }
    }
    // 将原始函数和绑定版本存储到映射中
    functionBoundedValueMap.set(value, boundValue);
    // 返回绑定版本
    return boundValue;
  }
  // 如果不是函数或是构造函数，则直接返回原始值
  return value;
}
