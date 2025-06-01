/* eslint-disable @typescript-eslint/no-explicit-any */
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
 * @description 处理主应用中 DOM 元素的动态添加，特别是样式和脚本资源的拦截和转换
 */

import { appCache } from '../cache/app-cache';
import { Script } from '../entry/script';
import { Style } from '../entry/style';
import { setMarkElement } from '../utils';
import { fillUpPath } from '../utils/common';
import { dispatchLinkOrScriptError, dispatchLinkOrScriptLoad } from '../utils/custom';
import { fetchSource } from '../utils/fetch';

type DOMMethodSignature = (...args: any[]) => any;

/**
 * 获取样式静态资源并创建替换元素
 * @description 将 link 标签转换为 style 标签，异步加载样式静态资源
 * @param url - 样式资源的 URL 地址
 * @param style - 样式实例对象
 * @param originLink - 原始的 link 标签元素
 * @returns HTMLStyleElement - 返回用于替换的 style 标签
 */
function getStyleSource(url: string, style: Style, originLink: HTMLLinkElement): HTMLStyleElement {
  const replaceStyle = document.createElement('style');
  setMarkElement(replaceStyle);

  fetchSource(url)
    .then((data: string) => {
      style.code = data;
      appCache.setBaseAppStyle(url, style);
      replaceStyle.textContent = data;
      dispatchLinkOrScriptLoad(originLink);
    })
    .catch(error => {
      console.error('Failed to load style resource:', error);
      dispatchLinkOrScriptError(originLink);
    });

  return replaceStyle;
}

/**
 * 获取脚本资源并创建替换元素
 * @description 异步加载脚本内容并创建新的 script 标签
 * @param url - 脚本资源的 URL 地址
 * @param script - 脚本实例对象
 * @param originScript - 原始的 script 标签元素
 * @returns Comment | HTMLScriptElement - 返回用于替换的 script 标签或注释节点
 */
function getScriptSource(url: string, script: Script, originScript: HTMLScriptElement): Comment | HTMLScriptElement {
  const replaceScript: HTMLScriptElement = document.createElement('script');
  setMarkElement(replaceScript);

  fetchSource(url)
    .then((code: string) => {
      script.setCode(code);

      try {
        replaceScript.textContent = code;

        // 为非内联脚本设置原始 src 属性
        if (!url.startsWith('inline-')) {
          originScript.setAttribute('origin-src', url);
        }
      } catch (error) {
        console.error('Failed to set script content:', error, url);
      }

      dispatchLinkOrScriptLoad(originScript);
    })
    .catch(error => {
      console.error('Failed to load script resource:', error);
      dispatchLinkOrScriptError(originScript);
    });

  return replaceScript;
}

/**
 * 处理 link 标签转换
 * @description 将 link 标签转换为 style 标签并处理样式加载
 * @param linkElement - link 标签元素
 * @returns Node - 转换后的节点或原节点
 */
function processLinkElement(linkElement: HTMLLinkElement): Node {
  const rel = linkElement.getAttribute('rel');
  let href = linkElement.getAttribute('href');

  if (rel === 'stylesheet' && href) {
    href = fillUpPath(href, location.origin);

    const replaceStyle = document.createElement('style');
    const styleInstance = new Style({
      code: '',
      fromHtml: false,
      url: href,
    });

    getStyleSource(href, styleInstance, linkElement);
    return replaceStyle;
  }

  return linkElement;
}

/**
 * 处理 script 标签转换
 * @description 处理脚本标签的加载和转换逻辑
 * @param scriptElement - script 标签元素
 * @returns Node - 转换后的节点或原节点
 */
function processScriptElement(scriptElement: HTMLScriptElement): Node {
  let src = scriptElement.getAttribute('src');

  if (src && scriptElement.type !== 'module') {
    src = fillUpPath(src, location.origin);

    const script = new Script({
      async: scriptElement.hasAttribute('async'),
      code: '',
      defer: scriptElement.defer || scriptElement.type === 'module',
      fromHtml: false,
      isModule: false,
    });

    appCache.setBaseAppScript(src, script);
    const replaceElement = getScriptSource(src, script, scriptElement);
    return replaceElement || scriptElement;
  }

  return scriptElement;
}

/**
 * 创建新的替换节点
 * @description 根据节点类型创建相应的替换节点，主要处理 link 和 script 标签
 * @param child - 要处理的子节点
 * @returns Node - 返回替换后的节点或原节点
 */
function createNewNode(child: Node): Node {
  if (child instanceof HTMLLinkElement) {
    return processLinkElement(child);
  }

  if (child instanceof HTMLScriptElement) {
    return processScriptElement(child);
  }

  return child;
}

/**
 * 检查节点是否为 link 或 script 标签
 * @description 判断给定节点是否需要特殊处理
 * @param node - 要检查的节点
 * @returns boolean - 如果是 link 或 script 标签则返回 true
 */
function isLinkOrScript(node: Node): boolean {
  return node instanceof HTMLLinkElement || node instanceof HTMLScriptElement;
}

/**
 * 处理 insertBefore 操作的基础元素插入
 * @description 拦截并处理 DOM 的 insertBefore 操作，对 link 和 script 标签进行特殊处理
 * @param parent - 父节点
 * @param newChild - 要插入的新节点
 * @param referenceChild - 参考节点（插入位置的下一个兄弟节点）
 * @param rawMethod - 原始的 DOM 操作方法
 * @returns Node - 返回原始方法的执行结果
 */
export function baseElementInertHandle<T extends Node>(
  parent: Node,
  newChild: Node,
  referenceChild: Node | null,
  rawMethod: DOMMethodSignature,
): T {
  if (isLinkOrScript(newChild)) {
    const targetChild = createNewNode(newChild);
    return rawMethod.call(parent, targetChild, referenceChild);
  }

  return rawMethod.call(parent, newChild, referenceChild);
}

/**
 * 处理 appendChild 操作的基础元素添加
 * @description 拦截并处理 DOM 的 appendChild 操作，对 link 和 script 标签进行特殊处理
 * @param parent - 父节点
 * @param newChild - 要添加的新节点
 * @param rawMethod - 原始的 DOM 操作方法
 * @returns Node - 返回原始方法的执行结果
 */
export function baseElementAppendHandle<T extends Node>(parent: T, newChild: T, rawMethod: DOMMethodSignature): T {
  if (isLinkOrScript(newChild)) {
    const targetChild = createNewNode(newChild);
    return rawMethod.call(parent, targetChild);
  }

  return rawMethod.call(parent, newChild);
}
