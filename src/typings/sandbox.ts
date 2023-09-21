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
 * Interface for injecting window attributes.
 */
export interface IInjectWindowAttrs {
  __BK_WEWEB_APP_KEY__: string; // The app key for the BK WEWEB platform.
  __BK_WEWEB_DATA__: Record<string, unknown>; // Additional data for BK WEWEB.
  __POWERED_BY_BK_WEWEB__: boolean; // Indicates if the page is powered by BK WEWEB.
  rawDocument: Document; // The original document object.
  rawWindow: Window; // The original window object.
}

export const WINDOW_WHITE_LIST: PropertyKey[] = [
  'System', // SystemJS
  '__cjsWrapper', // SystemJS CommonJS wrapper
  process.env.NODE_ENV !== 'production' ? '__REACT_DEVTOOLS_GLOBAL_HOOK__' : '',
];
// 一定需要在子应用自身上下文获取的属性名
export const BK_WEWEB_INJECT_KEY_LIST: PropertyKey[] = [
  '__POWERED_BY_BK_WEWEB__',
  '__BK_WEWEB_APP_KEY__',
  '__BK_WEWEB_DATA__',
];
export const WINDOW_ALIAS_LIST: PropertyKey[] = ['window', 'self', 'globalThis'];
// 设置了scopedLocation 后需要监听属性名
export const BK_WEWEB_LOCATION_KEY_LIST: PropertyKey[] = ['location', 'history'];
export const DEV_MICRO_APP_WINDOE_KEY_MAP: Record<PropertyKey, true> =
  process.env.NODE_ENV !== 'production'
    ? {
        __DEV__: true,
        __VUE_DEVTOOLS_GLOBAL_HOOK__: true,
        __VUE_DEVTOOLS_HOOK_REPLAY__: true,
        __VUE_DEVTOOLS_PLUGINS__: true,
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: true,
        __VUE_OPTIONS_API__: true,
        __bk_pop_manager: true,
        __bk_zIndex_manager: true,
        '__core-js_shared__': true,
        i18n: true,
        webpackChunkapm: true,
        webpackChunkpc: true,
        webpackChunktrace: true,
        webpackJsonp: true,
      }
    : {};
