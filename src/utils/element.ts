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
import { isJsonpUrl, randomUrl } from './common';
import { dispatchLinkOrScriptLoad } from './custom';

import type { BaseModel } from '../typings';

export type DOMMethod = <T extends Node = Node>(this: HTMLElement | Node, ...args: unknown[]) => T;
type SpecialElement = HTMLLinkElement | HTMLScriptElement | HTMLStyleElement;

// 原生DOM方法缓存
const { appendChild: bodyAppendChild } = HTMLBodyElement.prototype;

/** 处理样式元素 */
const handleStyleElement = (child: HTMLStyleElement, app: BaseModel): Node => {
  if (child.hasAttribute('exclude')) {
    return document.createComment('【bk-weweb】style with exclude attribute is ignored');
  }

  if (child.textContent) {
    // 父级应用样式已生效情况下，忽略子应用对应样式（web component的隔离下优化不生效）
    if (!(app.container instanceof ShadowRoot) && appCache.getBaseAppStyle(child.textContent)) {
      return document.createComment('【bk-weweb】style is effective in base app');
    }
  }

  if (!child.hasAttribute('ignore')) {
    const styleInstance = new Style({
      code: child.textContent || '',
      fromHtml: false,
      url: '',
    });
    app.source?.setStyle(randomUrl(), styleInstance);
    styleInstance.scopedStyleCSS(app, child);
  }

  return child;
};

/** 处理链接元素 */
const handleLinkElement = (child: HTMLLinkElement, parent: Node, app: BaseModel): Node => {
  const result = app.source?.collectLink(child, parent, true);
  if (!result) return child;

  if (result.style) {
    result.style.scopedLinkCSS(app, child);
  }

  return result.replace !== child ? result.replace : child;
};

/** 处理动态脚本观察器 */
const createScriptObserver = (child: HTMLScriptElement, parent: Node, app: BaseModel): MutationObserver => {
  const observer = new MutationObserver(() => {
    if (child.getAttribute('src')) {
      observer.disconnect();
      const scriptInfo = app.source!.collectScript(child, parent, true);

      if (scriptInfo?.replace) {
        bodyAppendChild.call(app.container, scriptInfo.replace);
      }

      // 处理异步JSONP
      if (isJsonpUrl(child.getAttribute('src'))) {
        app.container?.append(child);
        return;
      }

      if (scriptInfo?.script) {
        scriptInfo.script.executeCode(app);
      }
      child.remove();
    } else if (child.textContent) {
      observer.disconnect();
      const scriptInstance = new Script({
        async: false,
        code: child.textContent,
        defer: child.type === 'module',
        fromHtml: false,
        isModule: child.type === 'module',
      });

      app.source!.scripts.set(randomUrl(), scriptInstance);

      try {
        scriptInstance.executeCode(app);
      } catch (error) {
        console.error(error);
      } finally {
        if (!scriptInstance.isModule) {
          dispatchLinkOrScriptLoad(child);
        }
        child.remove();
      }
    }
  });

  return observer;
};

/** 处理脚本元素 */
const handleScriptElement = (child: HTMLScriptElement, parent: Node, app: BaseModel): Node => {
  const replaceInfo = app.source!.collectScript(child, parent, true);
  if (!replaceInfo) {
    return child;
  }

  if (replaceInfo.script) {
    replaceInfo.script.executeCode(app);
  }

  if (replaceInfo.replace !== child) {
    return replaceInfo.replace;
  }

  // 处理动态脚本
  if (app.scopeJs && !child.getAttribute('src') && !child.textContent) {
    const observer = createScriptObserver(child, parent, app);
    observer.observe(child, { attributeFilter: ['src'], childList: true, subtree: false });
    return document.createComment('【bk-weweb】dynamic script or module');
  }

  return child;
};

/** 重置新元素，根据元素类型进行相应处理 */
export const resetNewElement = (parent: Node, child: Node, app: BaseModel): Node => {
  if (child instanceof HTMLStyleElement) {
    return handleStyleElement(child, app);
  }

  if (child instanceof HTMLLinkElement) {
    return handleLinkElement(child, parent, app);
  }

  if (child instanceof HTMLScriptElement) {
    return handleScriptElement(child, parent, app);
  }

  return child;
};

/** 判断是否为特殊元素（script、style、link） */
export const isSpecialElement = (node: Node): node is SpecialElement => {
  return node instanceof HTMLScriptElement || node instanceof HTMLStyleElement || node instanceof HTMLLinkElement;
};

/** 获取目标容器 */
const getTargetContainer = (app: BaseModel, isSpecial: boolean): Node => {
  const needKeepAlive = isSpecial && !!app.keepAlive && !(app.container instanceof ShadowRoot);
  return needKeepAlive ? document.head : app.container!;
};

/**
 * 元素添加处理器
 * @param parent 父节点
 * @param newChild 新子节点
 * @param rawMethod 原始方法
 * @returns 处理结果
 */
export const elementAppendHandler = (parent: Node, newChild: Node, rawMethod: DOMMethod): Node => {
  if (!newChild.__BK_WEWEB_APP_KEY__) {
    return rawMethod.call(parent, newChild);
  }

  const app = appCache.getApp(newChild.__BK_WEWEB_APP_KEY__);
  if (!app?.container) {
    return rawMethod.call(parent, newChild);
  }

  const targetChild = resetNewElement(parent, newChild, app);
  const isSpecial = isSpecialElement(newChild);
  const needKeepAlive = isSpecial && !!app.keepAlive && !(app.container instanceof ShadowRoot);
  const container = getTargetContainer(app, isSpecial);

  setMarkElement(targetChild as Element, app, needKeepAlive);
  return rawMethod.call(container, targetChild);
};

/**
 * 元素插入处理器
 * @param parent 父节点
 * @param newChild 新子节点
 * @param passiveChild 参考节点
 * @param rawMethod 原始方法
 * @returns 处理结果
 */
export const elementInsertHandler = (
  parent: Node,
  newChild: Node,
  passiveChild: Node | null,
  rawMethod: DOMMethod,
): Node => {
  if (!newChild.__BK_WEWEB_APP_KEY__) {
    return rawMethod.call(parent, newChild, passiveChild);
  }

  const app = appCache.getApp(newChild.__BK_WEWEB_APP_KEY__);
  if (!app?.container) {
    return rawMethod.call(parent, newChild, passiveChild);
  }

  const isSpecial = isSpecialElement(newChild);
  const needKeepAlive = isSpecial && app.keepAlive && !(app.container instanceof ShadowRoot);
  const container = getTargetContainer(app, isSpecial);
  const targetChild = resetNewElement(parent, newChild, app);

  if (needKeepAlive) {
    setMarkElement(targetChild as Element, app, needKeepAlive);
  }

  if (passiveChild && !container.contains(passiveChild)) {
    return bodyAppendChild.call(container, targetChild);
  }

  return rawMethod.call(container, targetChild, passiveChild);
};

/**
 * 设置元素标记
 * @param element 元素
 * @param app 应用实例
 * @param keepAlive 是否保持活跃
 * @returns 标记后的元素
 */
export const setMarkElement = <T extends Element>(element: T, app?: BaseModel, keepAlive?: boolean): T => {
  if (keepAlive && app) {
    element.__KEEP_ALIVE__ = app.appCacheKey;
    element.setAttribute('data-from', app.name);
    element.setAttribute('data-keep-alive', 'true');
  }
  element.setAttribute?.('powered-by', 'bk-weweb');
  return element;
};
