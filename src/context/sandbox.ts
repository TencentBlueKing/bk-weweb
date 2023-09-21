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
/* eslint-disable no-new-func */
/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
import { MicroAppModel } from '../mode/app';
/*
inspired by https://github.com/umijs/qiankun
*/
import {
  BK_WEWEB_INJECT_KEY_LIST,
  BK_WEWEB_LOCATION_KEY_LIST,
  BaseModel,
  DEV_MICRO_APP_WINDOE_KEY_MAP,
  IInjectWindowAttrs,
  WINDOW_ALIAS_LIST,
  WINDOW_WHITE_LIST,
} from '../typings';
import { random } from '../utils/common';
import { windowNativeFuncMap } from './cache';
import { rewriteDocumentAndBodyEvent } from './event';
import bindFunctionToRawWindow from './function';
import { rewriteWindowFunction } from './window';

export default class SandBox {
  private active = false;
  private inRawWindowKeySet = new Set<PropertyKey>();
  private resetDocumentAndBodyEvent?: CallableFunction;
  private resetWindowFunction: CallableFunction;
  private sameRawWindowKeySet = new Set<PropertyKey>();

  public fakeWindow: Window & IInjectWindowAttrs = {} as any;
  public proxyWindow: WindowProxy & IInjectWindowAttrs;
  public rawDocument: Document;
  public rawWindow: Window;
  public windowSymbolKey: keyof Window;
  constructor(public app: BaseModel) {
    const windowDescriptorSet = new Set<PropertyKey>();
    const rawWindow = window;
    const rawDocument = window.document;
    this.fakeWindow.__POWERED_BY_BK_WEWEB__ = true;
    this.fakeWindow.__BK_WEWEB_APP_KEY__ = app.appCacheKey;
    this.rawWindow = rawWindow;
    this.rawDocument = rawDocument;
    this.fakeWindow.rawWindow = rawWindow;
    this.fakeWindow.rawDocument = rawDocument;
    const { resetWindowFunction } = rewriteWindowFunction(this.fakeWindow);
    this.resetWindowFunction = resetWindowFunction;
    this.windowSymbolKey = `__${(app.name || app.appCacheKey).replace(/(-|,|:|~|'|")/gim, '_')}_${random(
      10,
    )}__` as keyof Window;
    this.proxyWindow = new Proxy(this.fakeWindow, {
      // Object.defineProperty(window, key, Descriptor)
      defineProperty: (target: Window & any, key: PropertyKey, value: PropertyDescriptor): boolean => {
        if (windowDescriptorSet.has(key)) {
          return Reflect.defineProperty(rawWindow, key, value);
        }
        return Reflect.defineProperty(target, key, value);
      },
      deleteProperty: (target: Window & any, key: PropertyKey): boolean => {
        if (target.hasOwnProperty(key)) {
          this.sameRawWindowKeySet.has(key) && this.sameRawWindowKeySet.delete(key);
          this.inRawWindowKeySet.has(key) && Reflect.deleteProperty(rawWindow, key);
          return Reflect.deleteProperty(target, key);
        }
        return true;
      },
      get: (target: Window, key: string | symbol): unknown => {
        if (windowNativeFuncMap.has(key) || key === Symbol.unscopables) return rawWindow[key as any];
        if (DEV_MICRO_APP_WINDOE_KEY_MAP[key]) return this.fakeWindow[key as any];
        if (WINDOW_ALIAS_LIST.includes(key as string)) return this.proxyWindow;
        if (key === 'document') {
          app.registerRunningApp();
          return rawDocument;
        }
        if (key === 'eval') {
          app.registerRunningApp();
          // eslint-disable-next-line no-eval
          return eval;
        }
        if (
          BK_WEWEB_LOCATION_KEY_LIST.includes(key) &&
          this.app instanceof MicroAppModel &&
          this.app.iframe &&
          this.app.scopeLocation
        ) {
          return this.app.iframe.contentWindow?.[key as any];
        }
        if (key === 'hasOwnProperty')
          return (key: PropertyKey) => this.fakeWindow.hasOwnProperty(key) || rawWindow.hasOwnProperty(key);
        if (key === 'top' || key === 'parent') {
          if (rawWindow === rawWindow.parent) {
            return this.proxyWindow;
          }
          return Reflect.get(rawWindow, key); // iframe
        }
        if (Reflect.has(target, key) || BK_WEWEB_INJECT_KEY_LIST.includes(key)) return Reflect.get(target, key);
        const rawValue = Reflect.get(rawWindow, key);
        return bindFunctionToRawWindow(rawWindow, rawValue);
      },
      getOwnPropertyDescriptor: (target: any, key: PropertyKey): PropertyDescriptor | undefined => {
        if (target.hasOwnProperty(key)) {
          return Object.getOwnPropertyDescriptor(target, key);
        }
        if (rawWindow.hasOwnProperty(key)) {
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
      // Object.getOwnPropertyNames(window)
      ownKeys: (target: Window & any): Array<string | symbol> =>
        Array.from(new Set(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target)))),
      set: (target: any, key: PropertyKey, value: unknown): boolean => {
        if (this.active) {
          // 设置了scope location，需要同步到iframe
          if (
            BK_WEWEB_LOCATION_KEY_LIST.includes(key) &&
            this.app instanceof MicroAppModel &&
            this.app.iframe &&
            this.app.scopeLocation
          ) {
            return Reflect.set(this.app.iframe.contentWindow!, key, value);
          }
          // 共享主应用 location
          if (key === 'location') {
            Reflect.set(rawWindow, key, value);
          } else if (
            !target.hasOwnProperty(key) &&
            rawWindow.hasOwnProperty(key) &&
            !BK_WEWEB_INJECT_KEY_LIST.includes(key)
          ) {
            const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
            const { configurable, enumerable, writable } = descriptor!;
            if (writable) {
              Object.defineProperty(target, key, {
                configurable,
                enumerable,
                value,
                writable,
              });
              this.sameRawWindowKeySet.add(key);
            }
          } else {
            Reflect.set(target, key, value);
            this.sameRawWindowKeySet.add(key);
          }
          if (
            WINDOW_WHITE_LIST.includes(key) &&
            !Reflect.has(rawWindow, key) &&
            !BK_WEWEB_INJECT_KEY_LIST.includes(key)
          ) {
            Reflect.set(rawWindow, key, value);
            this.inRawWindowKeySet.add(key);
          }
        }
        return true;
      },
    });
    if (app.showSourceCode) {
      rawWindow[this.windowSymbolKey as any] = this.proxyWindow;
    }
  }
  /**
   *
   * @param data data for sandbox
   * @description active hook for sandbox
   */
  activeated(data?: Record<string, unknown>): void {
    if (!this.active) {
      this.active = true;
      this.fakeWindow.__BK_WEWEB_DATA__ = data ?? {};
      const { resetDocumentAndBodyEvent } = rewriteDocumentAndBodyEvent();
      this.resetDocumentAndBodyEvent = resetDocumentAndBodyEvent;
    }
  }
  /**
   *
   * @description decativated hook for sandbox
   */
  deactivated(): void {
    if (!this.active) return;
    this.active = false;
    this.resetWindowFunction();
    this.inRawWindowKeySet.forEach((key: PropertyKey) => Reflect.deleteProperty(window, key));
    this.inRawWindowKeySet.clear();
    this.resetDocumentAndBodyEvent?.();
  }
}
