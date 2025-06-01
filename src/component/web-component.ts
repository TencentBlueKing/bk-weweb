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

/**
 * BK WEWEB 自定义 Web Component 模块
 * @description 提供基于 Web Components 标准的微应用容器组件
 */

import { appCache } from '../cache/app-cache';
import { AppState } from '../common';
import { activated } from '../lifecycle/activated';
import { deactivated } from '../lifecycle/deactivated';
import { load } from '../lifecycle/load';
import { unmount } from '../lifecycle/unmount';
import { type IAppModelProps, type IJsModelProps, WewebMode } from '../typings';

/**
 * BK WEWEB 支持的自定义属性枚举
 * @description 定义了 bk-weweb 自定义元素支持的所有属性配置
 */
export enum WewebCustomAttrs {
  /** 传递给子应用的数据 */
  data = 'data',
  /** 应用唯一标识符 */
  id = 'id',
  /** 是否启用缓存模式 */
  keepAlive = 'keepAlive',
  /** 应用运行模式 */
  mode = 'mode',
  /** 是否开启 CSS 样式隔离 */
  scopeCss = 'scopeCss',
  /** 是否开启 JavaScript 隔离 */
  scopeJs = 'scopeJs',
  /** 是否开启 location 路由隔离 */
  scopeLocation = 'scopeLocation',
  /** 是否启用 Shadow DOM */
  setShodowDom = 'setShodowDom',
  /** 是否显示源码 */
  showSourceCode = 'showSourceCode',
  /** 应用资源 URL */
  url = 'url',
}

/**
 * BK WEWEB 自定义元素类
 * @description 基于 Web Components 标准实现的微应用容器组件
 */
export default class BkWewebElement extends HTMLElement {
  /** 应用 URL 缓存 */
  private appUrl = '';

  /** 组件连接状态标识 */
  private connected = false;

  /**
   * 观察的属性列表
   * @description 定义需要监听变化的属性名称列表
   * @returns string[] - 属性名称数组
   */
  static get observedAttributes(): string[] {
    return [WewebCustomAttrs.url];
  }

  /**
   * 获取布尔类型属性值
   * @description 解析布尔类型的自定义属性，支持驼峰和短横线命名
   * @param name - 属性名称
   * @returns boolean | undefined - 属性值或 undefined
   * @private
   */
  private getBooleanAttr(name: string): boolean | undefined {
    const hasAttr = this.hasAttribute(name) || this.hasAttribute(name.replace(/([A-Z])/g, '-$1').toLocaleLowerCase());
    return hasAttr ? this.getAttribute(name) !== 'false' : undefined;
  }

  /**
   * 处理属性变化的内部逻辑
   * @description 当属性发生变化时执行的处理逻辑
   * @returns Promise<void>
   * @private
   */
  private async handleAttributeChanged(): Promise<void> {
    if (!this.appKey) return;

    // 如果需要 Shadow DOM，则创建
    if (this.getBooleanAttr(WewebCustomAttrs.setShodowDom)) {
      this.attachShadow({ mode: 'open' });
    }

    const app = appCache.getApp(this.appKey);

    // 如果应用已存在且 URL 匹配，且是预加载或已卸载状态，则激活
    if (app && app.url === this.appUrl && (app.isPreLoad || app.status === AppState.UNMOUNT)) {
      activated(this.appKey, this.shadowRoot ?? this);
      return;
    }

    // 否则重新加载应用
    await load(this.appProps);
  }

  /**
   * 属性变化回调
   * @description 当观察的属性发生变化时触发
   * @param attr - 变化的属性名
   * @param _oldVal - 旧值（未使用）
   * @param newVal - 新值
   */
  attributeChangedCallback(attr: WewebCustomAttrs, _oldVal: string, newVal: string): void {
    // 只处理 URL 属性变化，且值确实发生改变，且组件已连接
    if (attr !== WewebCustomAttrs.url || this[attr] === newVal || !this.connected) return;

    this.appUrl = newVal;
    const cacheApp = appCache.getApp(this.appKey!);

    // 如果组件已连接或存在缓存应用，则处理属性变化
    if (this.connected || cacheApp) {
      this.handleAttributeChanged();
    }
  }

  /**
   * 组件连接到 DOM 时的回调
   * @description 当自定义元素被插入到 DOM 时触发
   * @returns Promise<void>
   */
  async connectedCallback(): Promise<void> {
    // 如果需要且尚未创建 Shadow DOM，则创建
    if (this.getBooleanAttr(WewebCustomAttrs.setShodowDom) && !this.shadowRoot) {
      this.attachShadow({ delegatesFocus: false, mode: 'open' });
    }

    // 加载应用
    await load(this.appProps);

    // 激活应用
    activated(this.appKey!, this.shadowRoot ?? this);

    // 标记为已连接
    this.connected = true;
  }

  /**
   * 组件从 DOM 断开时的回调
   * @description 当自定义元素从 DOM 中移除时触发
   */
  disconnectedCallback(): void {
    this.connected = false;

    // 根据 keepAlive 配置决定失活还是卸载
    if (this.appProps.keepAlive) {
      deactivated(this.appKey!);
    } else {
      unmount(this.appKey!);
    }
  }

  /**
   * 获取应用数据
   * @description 解析 data 属性中的 JSON 数据
   * @returns Record<string, unknown> - 应用数据对象
   */
  get appData(): Record<string, unknown> {
    if (this.hasAttribute(WewebCustomAttrs.data)) {
      try {
        return JSON.parse(this.getAttribute(WewebCustomAttrs.data)!);
      } catch {
        // JSON 解析失败时返回空对象
      }
    }
    return {};
  }

  /**
   * 获取应用标识符
   * @description 优先使用 id 属性，其次使用 url 属性作为应用标识
   * 考虑到 JS 模式下需要 JS bundle 的复用性，需用户设置 id 属性
   * 如果是单实例应用则可以不用配置 id
   * @returns string | null - 应用标识符或 null
   */
  get appKey(): null | string {
    return this.getAttribute(WewebCustomAttrs.id) || this.getAttribute(WewebCustomAttrs.url);
  }

  /**
   * 获取应用配置属性
   * @description 根据模式返回相应的应用配置对象
   * @returns IAppModelProps | IJsModelProps - 应用配置对象
   */
  get appProps(): IAppModelProps | IJsModelProps {
    const commonProps = {
      container: this.shadowRoot ?? this,
      data: this.appData,
      id: this.appKey!,
      keepAlive: this.getBooleanAttr(WewebCustomAttrs.keepAlive),
      showSourceCode: this.getBooleanAttr(WewebCustomAttrs.showSourceCode),
      url: this.getAttribute(WewebCustomAttrs.url)!,
    };

    // 根据模式返回不同的配置
    if (this.getAttribute('mode') === WewebMode.INSTANCE) {
      return {
        ...commonProps,
        mode: WewebMode.INSTANCE,
        scopeCss: this.getBooleanAttr(WewebCustomAttrs.scopeCss) && !this.getBooleanAttr(WewebCustomAttrs.setShodowDom),
        scopeJs: this.getBooleanAttr(WewebCustomAttrs.scopeJs),
      };
    }

    return {
      ...commonProps,
      mode: WewebMode.APP,
      scopeCss: !this.getBooleanAttr(WewebCustomAttrs.setShodowDom),
      scopeJs: !this.getBooleanAttr(WewebCustomAttrs.scopeJs),
      scopeLocation: this.getBooleanAttr(WewebCustomAttrs.scopeLocation),
    };
  }
}
