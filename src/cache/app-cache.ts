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

/**
 * 应用缓存管理模块
 * @description 提供微应用实例、资源缓存和全局状态管理功能
 */

import { AppState } from '../common';
import { EntrySource } from '../entry/entry';

import type { Script } from '../entry/script';
import type { Style } from '../entry/style';
import type { BaseModel } from '../typings';

/**
 * 应用缓存管理器
 * @description 负责管理所有微应用实例的缓存、资源共享和状态跟踪
 */
export class AppCache {
  /** 基础资源源，用于主应用共享资源包 */
  private readonly baseSource: EntrySource;

  /** 应用实例缓存映射表 */
  private readonly cache: Map<string, BaseModel>;

  /**
   * 构造函数
   * @description 初始化应用缓存管理器
   */
  constructor() {
    this.cache = new Map();
    this.baseSource = new EntrySource(location.href);
  }

  /**
   * 设置应用实例到缓存
   * @description 将应用实例添加到缓存中，使用应用的缓存键作为标识
   * @param app - 要缓存的应用实例
   */
  setApp(app: BaseModel): void {
    this.cache.set(app.appCacheKey, app);
  }

  /**
   * 获取缓存的应用实例
   * @description 根据名称或ID获取已缓存的应用实例
   * @param name - 应用名称或ID，为空时返回 undefined
   * @returns BaseModel | undefined - 应用实例或 undefined
   */
  getApp(name?: null | string): BaseModel | undefined {
    if (!name) return undefined;

    // 首先尝试直接从缓存键获取
    const app = this.cache.get(name);
    if (app) return app;

    // 如果未找到，则通过应用名称查找
    return Array.from(this.cache.values()).find((item: BaseModel) => item.name === name);
  }

  /**
   * 删除缓存的应用实例
   * @description 从缓存中移除指定URL的应用实例
   * @param url - 要删除的应用URL标识
   */
  deleteApp(url: string): void {
    this.cache.delete(url);
  }

  /**
   * 获取缓存的HTML内容
   * @description 根据URL获取已缓存的HTML内容
   * @param url - 应用的URL
   * @returns string - HTML内容，未找到时返回空字符串
   */
  getCacheHtml(url: string): string {
    const list = Array.from(this.cache.values());
    const app = list.find(item => item.url === url);

    if (app) return app.source?.rawHtml || '';
    return '';
  }

  /**
   * 设置基础应用脚本
   * @description 将脚本添加到基础资源源中，供多个应用共享
   * @param url - 脚本的URL
   * @param script - 脚本实例
   */
  setBaseAppScript(url: string, script: Script): void {
    this.baseSource.setScript(url, script);
  }

  /**
   * 获取缓存的脚本资源
   * @description 从基础资源源或应用缓存中获取脚本资源
   * @param url - 脚本的URL
   * @returns Script | undefined - 脚本实例或 undefined
   */
  getCacheScript(url: string): Script | undefined {
    // 首先从基础资源源中查找
    let script: Script | undefined = this.baseSource.getScript(url);
    if (script) return script;

    // 从应用缓存中查找
    const list = Array.from(this.cache.values());
    list.some(app => {
      script = app.source?.getScript(url);
      return !!script;
    });

    return script;
  }

  /**
   * 设置基础应用样式
   * @description 将样式添加到基础资源源中，供多个应用共享
   * @param url - 样式的URL
   * @param style - 样式实例
   */
  setBaseAppStyle(url: string, style: Style): void {
    this.baseSource.setStyle(url, style);
  }

  /**
   * 获取基础应用样式
   * @description 从基础资源源中获取样式资源
   * @param urlOrCode - 样式的URL或代码
   * @returns Style | undefined - 样式实例或 undefined
   */
  getBaseAppStyle(urlOrCode: string): Style | undefined {
    return this.baseSource.getStyle(urlOrCode);
  }

  /**
   * 获取缓存的样式资源
   * @description 从基础资源源或应用缓存中获取样式资源
   * @param url - 样式的URL
   * @returns Style | undefined - 样式实例或 undefined
   */
  getCacheStyle(url: string): Style | undefined {
    // 首先从基础资源源中查找
    let style: Style | undefined = this.baseSource.getStyle(url);
    if (style) return style;

    // 从应用缓存中查找
    const list = Array.from(this.cache.values());
    list.some(app => {
      style = app.source?.getStyle(url);
      return !!style;
    });

    return style;
  }

  /**
   * 检查是否存在活跃的应用
   * @description 判断当前是否有处于非卸载状态的应用实例
   * @returns boolean - 存在活跃应用时返回 true
   */
  get hasActiveApp(): boolean {
    return Array.from(this.cache.values()).some((app: BaseModel) => app.status !== AppState.UNMOUNT);
  }
}

/**
 * 全局应用缓存实例
 */
const appCache = new AppCache();

/**
 * 注册全局应用获取方法
 * @description 在 window 对象上注册获取缓存应用或实例的方法
 */
window.__getAppOrInstance__ = (id?: string) => {
  if (!id) return appCache;
  return appCache.getApp(id);
};

export { appCache };
