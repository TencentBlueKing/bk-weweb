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
import { AppState } from '../common';
import { EntrySource } from '../entry/entry';

import type { Script } from '../entry/script';
import type { Style } from '../entry/style';
import type { BaseModel } from '../typings';
// 所有应用缓存
export class AppCache {
  // todo 主应用共享资源包
  private baseSource: EntrySource;
  private cache: Map<string, BaseModel>;
  constructor() {
    this.cache = new Map();
    this.baseSource = new EntrySource(location.href);
  }
  // 删除缓存
  deleteApp(url: string) {
    this.cache.delete(url);
  }
  // 获取缓存app
  getApp(name?: null | string): BaseModel | undefined {
    if (!name) return undefined;
    const app = this.cache.get(name);
    if (app) return app;
    return Array.from(this.cache.values()).find((item: BaseModel) => item.name === name);
  }
  // 获取缓存app
  getBaseAppStyle(urlOrCode: string) {
    return this.baseSource.getStyle(urlOrCode);
  }
  getCacheHtml(url: string): string {
    const list = Array.from(this.cache.values());
    const app = list.find(item => item.url === url);
    if (app) return app.source?.rawHtml || '';
    return '';
  }
  getCacheScript(url: string): Script | undefined {
    let script: Script | undefined = this.baseSource.getScript(url);
    if (script) return;
    const list = Array.from(this.cache.values());
    list.some(app => {
      script = app.source?.getScript(url);
      return !!script;
    });
    return script;
  }
  getCacheStyle(url: string): Style | undefined {
    let style: Style | undefined = this.baseSource.getStyle(url);
    if (style) return;
    const list = Array.from(this.cache.values());
    list.some(app => {
      style = app.source?.getStyle(url);
      return !!style;
    });
    return style;
  }
  setApp(app: BaseModel) {
    this.cache.set(app.appCacheKey, app);
  }
  setBaseAppScript(url: string, script: Script) {
    this.baseSource.setScript(url, script);
  }
  setBaseAppStyle(url: string, style: Style) {
    this.baseSource.setStyle(url, style);
  }
  get hasActiveApp() {
    return Array.from(this.cache.values()).some((app: BaseModel) => app.status !== AppState.UNMOUNT);
  }
}
const appCache = new AppCache();
// 注册全局获取缓存app 或者 instance
window.__getAppOrInstance__ = (id?: string) => {
  if (!id) return appCache;
  return appCache.getApp(id);
};
export { appCache };
