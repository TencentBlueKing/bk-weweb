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
import { getGlobalContextCode } from '../context/cache';
import { MicroAppModel } from '../mode/app';
import { MicroInstanceModel } from '../mode/instance';
import { setMarkElement } from '../utils';
import { fetchSource } from '../utils/fetch';

import type { BaseModel, IScriptOption } from '../typings';

// 全局属性标记变量
let firstGlobalProp: string | undefined;
let secondGlobalProp: string | undefined;
let lastGlobalProp: string | undefined;

const STRICT_MODE_REGEX = /^"use\sstrict";$/gim;

type ExecuteResult = Comment | HTMLScriptElement | undefined;

/** Script脚本实例类 */
export class Script {
  async = false;
  code = '';
  defer = false;
  exportInstance?: unknown;
  fromHtml: boolean;
  initial: boolean;
  isModule = false;
  scoped: boolean;
  url: string | undefined;

  constructor({ async, code, defer, fromHtml, initial, isModule, url }: IScriptOption) {
    this.code = code?.replace(STRICT_MODE_REGEX, '');
    this.async = async;
    this.defer = defer;
    this.isModule = isModule;
    this.url = url;
    this.scoped = false;
    this.fromHtml = fromHtml ?? false;
    this.initial = initial ?? false;
  }

  /** 执行脚本代码 */
  async executeCode(app: BaseModel, needReplaceScriptElement = false): Promise<ExecuteResult> {
    try {
      if (!this.code) await this.getCode(app);

      if (app instanceof MicroInstanceModel) {
        const globalWindow = app.scopeJs ? app.sandBox?.proxyWindow || window : window;
        noteGlobalProps(globalWindow);
      }

      const scopedCode = this.transformCode(app);

      if (app.showSourceCode || this.isModule) {
        const scriptElement = document.createElement('script');
        if (scriptElement.__BK_WEWEB_APP_KEY__) {
          scriptElement.__BK_WEWEB_APP_KEY__ = undefined;
        }
        app.registerRunningApp();
        this.executeSourceScript(scriptElement, scopedCode);

        if (needReplaceScriptElement) return scriptElement;

        const needKeepAlive = !!app.keepAlive && !(app.container instanceof ShadowRoot);
        const container = needKeepAlive ? document.head : app.container;
        setMarkElement(scriptElement, app, needKeepAlive);
        container!.appendChild(scriptElement);
      } else {
        this.executeMemoryScript(app, scopedCode);
        if (needReplaceScriptElement) return document.createComment('【bk-weweb】dynamic script');
      }

      if (app instanceof MicroInstanceModel) {
        const globalWindow = app.scopeJs ? app.sandBox?.proxyWindow || window : window;
        // 判断是否是 iife var 的函数模块
        const isIifeVar = !!this.code.replace(/\/\*[\s\S]*?\*\//g, '').match(/^\s*var\s/);
        const exportProp = getGlobalProp(globalWindow, isIifeVar);
        if (exportProp) {
          this.exportInstance = (globalWindow as unknown as Record<string, unknown>)[exportProp];
          // window 下需清除全局副作用
          if (!app.scopeJs) {
            const descriptor = Object.getOwnPropertyDescriptor(globalWindow, exportProp);
            if (descriptor?.configurable) {
              delete (globalWindow as unknown as Record<string, unknown>)[exportProp];
            }
          }
        }
      }
    } catch (error) {
      console.error('execute script code error', error);
    }
    return;
  }

  /** 内存脚本执行 */
  executeMemoryScript(app: BaseModel, scopedCode: string): void {
    try {
      const isScopedLocation = app instanceof MicroAppModel && app.scopeLocation;
      app.registerRunningApp();

      new Function('window', 'location', 'history', scopedCode)(
        app.sandBox!.proxyWindow || window,
        isScopedLocation ? app.iframe!.contentWindow!.location : window.location,
        isScopedLocation ? app.iframe!.contentWindow!.history : window.history,
      );
    } catch (error) {
      console.error(error);
    }
  }

  /** 脚本标签执行 */
  executeSourceScript(scriptElement: HTMLScriptElement, scopedCode: string): void {
    if (this.isModule) {
      scriptElement.src = `${this.url}?key=${Date.now()}`;
      scriptElement.setAttribute('type', 'module');
    } else {
      scriptElement.textContent = scopedCode;
    }
    this.url && scriptElement.setAttribute('origin-src', this.url);
  }

  /** 获取脚本内容 */
  async getCode(app?: BaseModel): Promise<string> {
    if (this.code.length || !this.url) {
      return this.code;
    }

    let code = '';
    if (app?.source?.getScript(this.url)) {
      code = app.source.getScript(this.url)?.code || '';
    }
    if (!code && appCache.getCacheScript(this.url)) {
      code = appCache.getCacheScript(this.url)?.code || '';
    }
    if (!code) {
      code = await fetchSource(this.url, {}, app).catch(error => {
        console.error(`fetch script ${this.url} error`, error);
        return '';
      });
    }

    code = code.replace(STRICT_MODE_REGEX, '');
    this.code = code;
    return code;
  }

  setCode(code: string): void {
    this.code = code;
  }

  /** 转换脚本内容 */
  transformCode(app: BaseModel): string {
    const sourceMapUrl = '';

    if (app.sandBox) {
      if (this.isModule) {
        return ` with(window.${app.sandBox.windowSymbolKey}){
          ;${this.code}\n
          ${sourceMapUrl}
        }`;
      }
      if (app.showSourceCode) {
        return `;(function(window, self, globalThis){
                  with(window){
                    ${getGlobalContextCode()}\n
                    ${this.code}\n
                    ${sourceMapUrl}
                  }
                }).call(window.${app.sandBox.windowSymbolKey},
                  window.${app.sandBox.windowSymbolKey}, window.${app.sandBox.windowSymbolKey}, window.${app.sandBox.windowSymbolKey});`;
      }
      return `
          with(window) {
            try {
              ${getGlobalContextCode()}\n
                ${this.code}\n
                ${sourceMapUrl}
              }
              catch(e) {
                console.error(e)
              }
            }
      `;
    }
    return this.code;
  }
}

/** 全局属性是否跳过标记 */
export function shouldSkipProperty(global: Window, property: number | string): boolean {
  const globalWindow = global as unknown as Record<string, unknown>;
  return (
    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
    !global.hasOwnProperty(property) ||
    (!Number.isNaN(property) && (property as number) < global.length) ||
    (typeof navigator !== 'undefined' &&
      navigator.userAgent.indexOf('Trident') !== -1 &&
      Boolean(globalWindow[property]) &&
      typeof window !== 'undefined' &&
      (globalWindow[property] as { parent?: Window })?.parent === window)
  );
}

/** 获取脚本执行后绑定的export实例 */
export function getGlobalProp(global: Window, useFirstGlobalProp?: boolean): string | undefined {
  let cnt = 0;
  let foundLastProp: boolean | undefined;
  let result: string | undefined;

  for (const property in global) {
    // do not check frames cause it could be removed during import
    if (shouldSkipProperty(global, property)) continue;

    if ((cnt === 0 && property !== firstGlobalProp) || (cnt === 1 && property !== secondGlobalProp)) {
      return property;
    }

    if (foundLastProp) {
      lastGlobalProp = property;
      result = (useFirstGlobalProp && result) || property;
    } else {
      foundLastProp = property === lastGlobalProp;
    }
    cnt += 1;
  }

  return result;
}

/** 标记全局属性 */
export function noteGlobalProps(global: Window): string | undefined {
  secondGlobalProp = undefined;
  firstGlobalProp = secondGlobalProp;

  for (const property in global) {
    if (shouldSkipProperty(global, property)) continue;

    if (!firstGlobalProp) {
      firstGlobalProp = property;
    } else if (!secondGlobalProp) {
      secondGlobalProp = property;
    }
    lastGlobalProp = property;
  }

  return lastGlobalProp;
}

/**
 * app初始化dom脚本执行
 */
export async function execAppScripts(app: BaseModel): Promise<void> {
  // const appInitialScriptList = Array.from(app.source!.scripts.values()).filter(script => script.initial);
  // // 初始化脚本最先执行
  // if (appInitialScriptList.length) {
  //   await Promise.all(appInitialScriptList.map(script => script.executeCode(app)));
  // }

  const appScriptList = Array.from(app.source!.scripts.values()).filter(script => script.fromHtml || script.initial);
  const commonList = appScriptList.filter(script => (!script.async && !script.defer) || script.isModule);

  // 保证同步脚本和module类型最先执行
  await Promise.all(commonList.map(script => script.getCode(app)));
  await Promise.all(commonList.map(script => script.executeCode(app)));

  // 最后执行defer和async脚本
  const deferScriptList: Promise<ExecuteResult>[] = [];
  const asyncScriptList: Promise<ExecuteResult>[] = [];

  // async defer 脚本执行
  for (const script of appScriptList) {
    if (script.defer || script.async) {
      if (!script.code && script.defer) {
        deferScriptList.push(script.executeCode(app));
      } else {
        asyncScriptList.push(script.executeCode(app));
      }
    }
  }

  await Promise.all([...asyncScriptList, ...deferScriptList]).catch(error => {
    console.error(error);
  });
}
