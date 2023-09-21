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
 * 接口定义：样式选项
 */
export interface IStyleOption {
  code: string; // 样式代码
  fromHtml: boolean; // 是否来自 HTML
  initial?: boolean; // 是否初始样式
  prefetch?: boolean; // 是否预取样式
  preload?: boolean; // 是否预加载样式
  url?: string; // 样式文件的 URL
}

export interface IScriptOption {
  async: boolean; // 是否为异步脚本
  code: string; // 脚本代码
  defer: boolean; // 是否为延迟脚本
  fromHtml: boolean; // 是否从 HTML 中提取
  initial?: boolean; // 是否为初始脚本
  isModule: boolean; // 是否为模块类型脚本
  url?: string; // 脚本的 URL 地址
}

export const CSS_ATTRIBUTE_KEY = 'id';

export enum CssRuleEnum {
  MEDIA_RULE = 4,
  STYLE_RULE = 1,
  SUPPORTS_RULE = 12,
}
type ValueOf<T> = T[keyof T];
export type DocumentEventListener = (this: Document, ev: ValueOf<DocumentEventMap>) => any;
