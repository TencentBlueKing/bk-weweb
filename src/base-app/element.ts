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
import { setMarkElement } from '../utils';
import { fillUpPath } from '../utils/common';
import { dispatchLinkOrScriptError, dispatchLinkOrScriptLoad } from '../utils/custom';
import { fetchSource } from '../utils/fetch';
/**
 * @param url 资源地址
 * @param style 样式实例
 * @param originLink 原始link标签
 * @returns 返回替换的style标签
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
    .catch(err => {
      console.error(err);
      dispatchLinkOrScriptError(originLink);
    });
  return replaceStyle;
}
/**
 * @param url 资源地址
 * @param script 脚本实例
 * @param originScript 原始script标签
 * @returns 返回替换的script标签
 */
function getScriptSource(url: string, script: Script, originScript: HTMLScriptElement): Comment | HTMLScriptElement {
  const replaceScript: HTMLScriptElement = document.createElement('script');
  setMarkElement(replaceScript);
  fetchSource(url)
    .then((code: string) => {
      script.setCode(code);
      try {
        replaceScript.textContent = code;
        if (!url.startsWith('inline-')) {
          originScript.setAttribute('origin-src', url);
        }
      } catch (e) {
        console.error(e, url);
      }
      dispatchLinkOrScriptLoad(originScript);
    })
    .catch(err => {
      console.error(err);
      dispatchLinkOrScriptError(originScript);
    });
  return replaceScript;
}
/**
 * @param child link或者script标签
 * @returns 返回替换的link或者script标签
 */
function createNewNode(child: Node): Node {
  if (child instanceof HTMLLinkElement) {
    const rel = child.getAttribute('rel');
    let href = child.getAttribute('href');
    if (rel === 'stylesheet' && href) {
      href = fillUpPath(href, location.origin);
      const replaceStyle = document.createElement('style');
      const styleInstance = new Style({
        code: '',
        fromHtml: false,
        url: href,
      });
      getStyleSource(href, styleInstance, child);
      return replaceStyle;
    }
  }
  if (child instanceof HTMLScriptElement) {
    let src = child.getAttribute('src');
    if (src && child.type !== 'module') {
      src = fillUpPath(src, location.origin);
      const script = new Script({
        async: child.hasAttribute('async'),
        code: '',
        defer: child.defer || child.type === 'module',
        fromHtml: false,
        isModule: false,
      });
      appCache.setBaseAppScript(src, script);
      const replaceElement = getScriptSource(src, script, child);
      return replaceElement || child;
    }
  }
  return child;
}
/**
 * @param node 节点
 * @returns 返回是否是link或者script标签
 */
function isLinkOrScript(node: Node) {
  return node instanceof HTMLLinkElement || node instanceof HTMLScriptElement;
}
/**
 * @param parent 父节点
 * @param newChild 新节点
 * @param passiveChild 被动节点
 * @param rawMethod 原始方法
 * @returns 返回原始方法的执行结果
 */
export function baseElementInertHandle(parent: Node, newChild: Node, passiveChild: Node | null, rawMethod: Function) {
  if (isLinkOrScript(newChild)) {
    const targetChild = createNewNode(newChild);
    return rawMethod.call(parent, targetChild, passiveChild);
  }
  return rawMethod.call(parent, newChild, passiveChild);
}
/**
 * @param parent 父节点
 * @param newChild 新节点
 * @param rawMethod 原始方法
 * @returns 返回原始方法的执行结果
 */
export function baseElementAppendHandle(parent: Node, newChild: Node, rawMethod: Function) {
  if (isLinkOrScript(newChild)) {
    const targetChild = createNewNode(newChild);
    return rawMethod.call(parent, targetChild);
  }
  return rawMethod.call(parent, newChild);
}
