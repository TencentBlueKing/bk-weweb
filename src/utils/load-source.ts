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
import { Script } from '../entry/script';
import { Style } from '../entry/style';

export type SourceFuncType = () => Promise<string[]>;
export type SourceType = SourceFuncType | string[];

interface CollectResult {
  collectScript?: Map<string, Script>;
  collectStyle?: Map<string, Style>;
}

const JS_FILE_REGEX = /\.js$/;
const CSS_FILE_REGEX = /\.css$/;

/**
 * 创建脚本实例
 * @param url 脚本URL
 * @returns Script实例
 */
const createScriptInstance = (url: string): Script => {
  const cachedScript = appCache.getCacheScript(url);
  return new Script({
    async: false,
    code: cachedScript?.code || '',
    defer: false,
    fromHtml: false,
    initial: true,
    isModule: false,
    url,
  });
};

/**
 * 创建样式实例
 * @param url 样式URL
 * @returns Style实例
 */
const createStyleInstance = (url: string): Style => {
  const cachedStyle = appCache.getCacheStyle(url);
  return new Style({
    code: cachedStyle?.code || '',
    fromHtml: true,
    initial: true,
    prefetch: false,
    preload: false,
    url,
  });
};

/**
 * 处理单个资源URL
 * @param url 资源URL字符串
 * @param collectScript 脚本收集Map
 * @param collectStyle 样式收集Map
 */
const processResourceUrl = (
  url: string,
  collectScript: Map<string, Script>,
  collectStyle: Map<string, Style>,
): void => {
  try {
    const urlObj = new URL(url);
    const { pathname } = urlObj;

    if (JS_FILE_REGEX.test(pathname)) {
      collectScript.set(url, createScriptInstance(url));
    } else if (CSS_FILE_REGEX.test(pathname)) {
      collectStyle.set(url, createStyleInstance(url));
    }
  } catch {
    console.error(`【bk-weweb】: ${url} is invalid URL`);
  }
};

/**
 * 收集和解析资源
 * @param sourceList 资源列表，可以是数组或返回数组的函数
 * @returns 包含收集到的脚本和样式的对象
 */
export const collectSource = async (sourceList: SourceType): Promise<CollectResult> => {
  const source: string[] = typeof sourceList === 'function' ? await sourceList() : sourceList || [];
  if (!source.length) return {};
  const collectScript = new Map<string, Script>();
  const collectStyle = new Map<string, Style>();

  // 处理每个资源URL
  for (const url of source) {
    processResourceUrl(url, collectScript, collectStyle);
  }
  return { collectScript, collectStyle };
};

/**
 * 加载全局静态资源
 * @param sourceList 资源列表，可以是数组或返回数组的函数
 * @throws 如果资源加载失败则抛出错误
 */
export const loadGlobalSource = async (sourceList: SourceType): Promise<void> => {
  const { collectScript, collectStyle } = await collectSource(sourceList);
  const loadPromises: Promise<string>[] = [];

  // 处理脚本资源
  if (collectScript) {
    for (const [url, script] of collectScript.entries()) {
      loadPromises.push(script.getCode());
      appCache.setBaseAppScript(url, script);
    }
  }

  // 处理样式资源
  if (collectStyle) {
    for (const [url, style] of collectStyle.entries()) {
      loadPromises.push(style.getCode());
      appCache.setBaseAppStyle(url, style);
    }
  }

  // 等待所有资源加载完成
  await Promise.all(loadPromises);
};
