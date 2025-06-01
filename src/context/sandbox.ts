/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/member-ordering */
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

/** 微前端沙箱模块，提供应用间的环境隔离 */

import { MicroAppModel } from '../mode/app';
import {
  BK_WEWEB_INJECT_KEY_LIST,
  BK_WEWEB_LOCATION_KEY_LIST,
  type BaseModel,
  DEV_MICRO_APP_WINDOW_KEY_MAP,
  type IInjectWindowAttrs,
  WINDOW_ALIAS_LIST,
  WINDOW_WHITE_LIST,
} from '../typings';
import { random } from '../utils/common';
import { windowNativeFuncMap } from './cache';
import { createProxyDocument } from './document';
import { rewriteDocumentAndBodyEvent } from './event';
import bindFunctionToRawWindow from './function';
import { rewriteWindowFunction, type FakeWindow } from './window';

/**
 * 微前端沙箱
 * @description 提供应用间的环境隔离，防止全局变量污染，支持多应用并存运行
 */
export default class SandBox {
  /** 沙箱激活状态标识 */
  private active = false;

  /** 记录在原始 window 上新增的属性键集合 */
  private readonly inRawWindowKeySet = new Set<PropertyKey>();

  /** 重置文档和 body 事件的函数 */
  private resetDocumentAndBodyEvent?: CallableFunction;

  /** 重置 window 函数的方法 */
  private readonly resetWindowFunction: CallableFunction;

  /** 记录与原始 window 相同的属性键集合 */
  private readonly sameRawWindowKeySet = new Set<PropertyKey>();

  /** 伪造的 window 对象 */
  public readonly fakeWindow: FakeWindow & IInjectWindowAttrs;

  /** 代理的 document 对象 */
  public proxyDocument: any;

  /** 代理的 window 对象 */
  public readonly proxyWindow: WindowProxy & IInjectWindowAttrs;

  /** 原始 document 对象 */
  public rawDocument: Record<string, any>;

  /** 原始 window 对象 */
  public readonly rawWindow: Window;

  /** 在 window 上的唯一标识键 */
  public readonly windowSymbolKey: keyof Window;

  /** 初始化沙箱环境 */
  constructor(public readonly app: BaseModel) {
    // 存储 window 描述符的集合
    const windowDescriptorSet = new Set<PropertyKey>();
    const rawWindow = window;
    this.rawWindow = rawWindow;

    // 创建代理 document
    this.rawDocument = createProxyDocument(document, app);

    // 创建fake window 对象
    const fakeWindow = Object.create({});
    fakeWindow.__BK_WEWEB_APP_KEY__ = app.appCacheKey;
    fakeWindow.__POWERED_BY_BK_WEWEB__ = true;
    fakeWindow.rawDocument = document;
    fakeWindow.rawWindow = rawWindow;
    fakeWindow.__proto__ = Window;
    this.fakeWindow = fakeWindow as FakeWindow & IInjectWindowAttrs;

    // 重写 window 函数
    const { resetWindowFunction } = rewriteWindowFunction(this.fakeWindow);
    this.resetWindowFunction = resetWindowFunction;

    // 生成唯一的 window 标识键
    const appIdentifier = (app.name || app.appCacheKey).replace(/[-,:~'"]/g, '_');
    this.windowSymbolKey = `__${appIdentifier}_${random(10)}__` as keyof Window;

    // 创建 window 代理对象
    this.proxyWindow = new Proxy(this.fakeWindow, {
      defineProperty: (target: Window, key: PropertyKey, value: PropertyDescriptor): boolean => {
        if (windowDescriptorSet.has(key)) {
          return Reflect.defineProperty(rawWindow, key, value);
        }
        return Reflect.defineProperty(target, key, value);
      },

      deleteProperty: (target: Window, key: PropertyKey): boolean => {
        if (Object.hasOwn(target, key)) {
          // 清理相关键集合
          if (this.sameRawWindowKeySet.has(key)) {
            this.sameRawWindowKeySet.delete(key);
          }
          if (this.inRawWindowKeySet.has(key)) {
            Reflect.deleteProperty(rawWindow, key);
          }
          return Reflect.deleteProperty(target, key);
        }
        return true;
      },

      get: (target: Window, key: string | symbol): unknown => {
        return this.handleProxyGet(target, key, rawWindow);
      },

      getOwnPropertyDescriptor: (target: any, key: PropertyKey): PropertyDescriptor | undefined => {
        if (Object.hasOwn(target, key)) {
          return Object.getOwnPropertyDescriptor(target, key);
        }

        if (Object.hasOwn(rawWindow, key)) {
          windowDescriptorSet.add(key);
          const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }

        return undefined;
      },

      has: (target: Window & any, key: PropertyKey): boolean =>
        windowNativeFuncMap.has(key) || key in target || key in rawWindow,

      ownKeys: (target: Window & any): Array<string | symbol> =>
        Array.from(new Set(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target)))),

      set: (target: any, key: PropertyKey, value: unknown): boolean => {
        return this.handleProxySet(target, key, value, rawWindow);
      },
    });
    rawWindow[this.windowSymbolKey] = this.proxyWindow as never;
  }

  /** 处理代理对象的 get 操作 */
  private handleProxyGet(target: Window, key: string | symbol, rawWindow: Window): unknown {
    // 处理 Symbol.unscopables 和原生函数
    if (key === Symbol.unscopables || windowNativeFuncMap.has(key)) {
      return rawWindow[key as any];
    }

    // 处理开发环境特殊键
    if (DEV_MICRO_APP_WINDOW_KEY_MAP[key]) {
      return this.fakeWindow[key as any];
    }

    // 处理 window 别名
    if (WINDOW_ALIAS_LIST.includes(key as string)) {
      return this.proxyWindow;
    }

    // 处理 document 访问
    if (key === 'document') {
      this.app.registerRunningApp();
      return this.rawDocument;
    }

    // 处理 eval 函数
    if (key === 'eval') {
      this.app.registerRunningApp();
      // biome-ignore lint/security/noGlobalEval: 这里需要返回 eval
      return eval;
    }

    // 处理 location 相关属性（iframe 沙盒）
    if (this.shouldUseIframeLocation(key)) {
      if (this.app instanceof MicroAppModel && this.app.iframe?.contentWindow) {
        return this.app.iframe.contentWindow[key as keyof Window];
      }
      return undefined;
    }

    // 重写 hasOwnProperty 方法
    if (key === 'hasOwnProperty') {
      return (checkKey: PropertyKey) => Object.hasOwn(this.fakeWindow, checkKey) || Object.hasOwn(rawWindow, checkKey);
    }

    // 处理 top 和 parent 属性
    if (key === 'top' || key === 'parent') {
      if (rawWindow === rawWindow.parent) {
        return this.proxyWindow;
      }
      return Reflect.get(rawWindow, key); // iframe 情况
    }

    // 重写 getComputedStyle 方法
    if (key === 'getComputedStyle') {
      return this.createGetComputedStyleProxy(rawWindow);
    }

    // 优先返回目标对象的属性
    if (Reflect.has(target, key) || BK_WEWEB_INJECT_KEY_LIST.includes(key as string)) {
      return Reflect.get(target, key);
    }

    // 从原始 window 获取属性并绑定上下文
    const rawValue = Reflect.get(rawWindow, key);
    return bindFunctionToRawWindow(rawWindow, rawValue);
  }

  /**
   * 处理代理对象的 set 操作
   * @description 统一处理代理对象属性设置的复杂逻辑
   * @param target - 目标对象
   * @param key - 属性键
   * @param value - 属性值
   * @param rawWindow - 原始 window 对象
   * @returns boolean - 设置是否成功
   * @private
   */
  private handleProxySet(target: any, key: PropertyKey, value: unknown, rawWindow: Window): boolean {
    if (!this.active) {
      return true;
    }

    // 处理 iframe 沙盒下的 location 设置
    if (this.shouldUseIframeLocation(key)) {
      const iframe = this.app instanceof MicroAppModel ? this.app.iframe : null;
      return iframe?.contentWindow ? Reflect.set(iframe.contentWindow, key, value) : true;
    }

    // 共享主应用 location
    if (key === 'location') {
      Reflect.set(rawWindow, key, value);
    } else if (this.shouldSetOnTarget(target, key, rawWindow)) {
      this.setPropertyOnTarget(target, key, value, rawWindow);
    } else {
      Reflect.set(target, key, value);
      this.sameRawWindowKeySet.add(key);
    }

    // 处理白名单属性
    this.handleWhiteListProperty(key, value, rawWindow);

    return true;
  }

  /**
   * 判断是否应该使用 iframe 的 location
   * @description 检查是否在 iframe 模式下访问 location 相关属性
   * @param key - 属性键
   * @returns boolean - 是否使用 iframe location
   * @private
   */
  private shouldUseIframeLocation(key: PropertyKey): boolean {
    return !!(
      BK_WEWEB_LOCATION_KEY_LIST.includes(key as string) &&
      this.app instanceof MicroAppModel &&
      this.app.iframe &&
      this.app.scopeLocation
    );
  }

  /**
   * 创建 getComputedStyle 方法的代理
   * @description 为 getComputedStyle 方法创建安全的代理实现
   * @param rawWindow - 原始 window 对象
   * @returns Function - 代理后的 getComputedStyle 方法
   * @private
   */
  private createGetComputedStyleProxy(
    rawWindow: Window,
  ): (element: Element, pseudoElt?: null | string) => CSSStyleDeclaration {
    return (element: Element, pseudoElt?: null | string) => {
      if (element instanceof Element) {
        return rawWindow.getComputedStyle(element, pseudoElt);
      }
      return rawWindow.getComputedStyle(document.body, pseudoElt);
    };
  }

  /**
   * 判断是否应该在目标对象上设置属性
   * @description 检查属性设置的逻辑条件
   * @param target - 目标对象
   * @param key - 属性键
   * @param rawWindow - 原始 window 对象
   * @returns boolean - 是否在目标对象上设置
   * @private
   */
  private shouldSetOnTarget(target: any, key: PropertyKey, rawWindow: Window): boolean {
    return (
      !Object.hasOwn(target, key) && Object.hasOwn(rawWindow, key) && !BK_WEWEB_INJECT_KEY_LIST.includes(key as string)
    );
  }

  /**
   * 在目标对象上设置属性
   * @description 安全地在目标对象上设置属性，保持描述符特性
   * @param target - 目标对象
   * @param key - 属性键
   * @param value - 属性值
   * @param rawWindow - 原始 window 对象
   * @private
   */
  private setPropertyOnTarget(target: any, key: PropertyKey, value: unknown, rawWindow: Window): void {
    const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);

    if (!descriptor) {
      return; // 如果没有描述符，直接返回
    }

    const { configurable, enumerable, writable } = descriptor;

    if (writable) {
      Object.defineProperty(target, key, {
        configurable,
        enumerable,
        value,
        writable,
      });
      this.sameRawWindowKeySet.add(key);
    }
  }

  /**
   * 处理白名单属性
   * @description 处理需要在原始 window 上设置的白名单属性
   * @param key - 属性键
   * @param value - 属性值
   * @param rawWindow - 原始 window 对象
   * @private
   */
  private handleWhiteListProperty(key: PropertyKey, value: unknown, rawWindow: Window): void {
    if (
      WINDOW_WHITE_LIST.includes(key as string) &&
      !Reflect.has(rawWindow, key) &&
      !BK_WEWEB_INJECT_KEY_LIST.includes(key as string)
    ) {
      Reflect.set(rawWindow, key, value);
      this.inRawWindowKeySet.add(key);
    }
  }

  /**
   * 激活沙箱
   * @description 启动沙箱环境，初始化代理对象和事件处理
   * @param data - 传递给沙箱的数据（可选）
   */
  activated(data?: Record<string, unknown>): void {
    if (!this.active) {
      this.active = true;
      this.rawDocument = createProxyDocument(document, this.app);
      this.fakeWindow.__BK_WEWEB_DATA__ = data ?? {};

      const { resetDocumentAndBodyEvent } = rewriteDocumentAndBodyEvent();
      this.resetDocumentAndBodyEvent = resetDocumentAndBodyEvent;
    }
  }

  /**
   * 停用沙箱
   * @description 关闭沙箱环境，清理所有副作用和修改
   */
  deactivated(): void {
    if (!this.active) return;

    this.active = false;

    // 重置 window 函数
    this.resetWindowFunction();

    // 清理在原始 window 上新增的属性
    for (const key of this.inRawWindowKeySet) {
      Reflect.deleteProperty(window, key);
    }
    this.inRawWindowKeySet.clear();

    // 重置文档和 body 事件
    this.resetDocumentAndBodyEvent?.();
  }
}
