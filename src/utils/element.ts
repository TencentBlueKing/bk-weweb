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
import { BaseModel } from '../typings';
import { isJsonpUrl, randomUrl } from './common';
import { dispatchLinkOrScriptLoad } from './custom';

const { appendChild: bodyAppendChild } = HTMLBodyElement.prototype;
export function resetNewElement(parent: Node, child: Node, app: BaseModel): Node {
  if (child instanceof HTMLStyleElement) {
    if (child.hasAttribute('exclude')) {
      return document.createComment('【bk-weweb】style with exclude attribute is ignored');
    }
    if (child.textContent) {
      // 父级应用样式已生效情况下 即可忽略子应用对应样式 webcomponent的隔离下优化不生效
      if (!(app.container instanceof ShadowRoot) && appCache.getBaseAppStyle(child.textContent)) {
        return document.createComment('【bk-weweb】style is effective in base app');
      }
    }
    // else {
    //   const observer = new MutationObserver(() => {
    //     if (child.textContent) {
    //       observer.disconnect();
    //       if (!(app.container instanceof ShadowRoot)
    //       && appCache.getBaseAppStyle(child.textContent)) {
    //         debugger;
    //         console.info('--------------');
    //         child.sheet!.disabled = true;
    //         child.setAttribute('aaaaaaaaaaaa', '------');
    //         parent.removeChild(child);
    //       }
    //     }
    //   });
    //   observer.observe(child, { attributeFilter: ['src'], childList: true, subtree: false });
    // }
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
  }
  if (child instanceof HTMLLinkElement) {
    const result = app.source?.collectLink(child, parent, true);
    if (!result) return child;
    if (result.style) {
      result.style.scopedLinkCSS(app, child);
    }
    if (result.replace !== child) {
      return result.replace;
    }
    return child;
  }
  if (child instanceof HTMLScriptElement) {
    const replaceInfo = app.source!.collectScript(child, parent, true);
    if (!replaceInfo) {
      return child;
    }
    if (replaceInfo.script) {
      replaceInfo.script.excuteCode(app);
    }
    if (replaceInfo.replace !== child) {
      return replaceInfo.replace;
    }
    if (app.scopeJs && !child.getAttribute('src') && !child.textContent) {
      const observer = new MutationObserver(() => {
        if (child.getAttribute('src')) {
          observer.disconnect();
          const scriptInfo = app.source!.collectScript(child, parent, true);
          if (scriptInfo?.replace) {
            bodyAppendChild.call(app.container, scriptInfo.replace);
          }
          // 处理异步jsonp
          if (isJsonpUrl(child.getAttribute('src'))) {
            app.container?.append(child);
            return;
          }
          if (scriptInfo?.script) {
            scriptInfo.script.excuteCode(app);
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
            scriptInstance.excuteCode(app);
          } catch (e) {
            console.error(e);
          } finally {
            !scriptInstance.isModule && dispatchLinkOrScriptLoad(child);
            child.remove();
          }
        }
      });
      observer.observe(child, { attributeFilter: ['src'], childList: true, subtree: false });
      return document.createComment('【bk-weweb】dynamic script or module');
    }
    return child;
  }
  return child;
}
export function isSepcailElement(node: Node) {
  return node instanceof HTMLScriptElement || node instanceof HTMLStyleElement || node instanceof HTMLLinkElement;
}
export function elmentAppendHandler(parent: Node, newChild: Node, rawMethod: Function) {
  if (newChild.__BK_WEWEB_APP_KEY__) {
    const app = appCache.getApp(newChild.__BK_WEWEB_APP_KEY__);
    if (app?.container) {
      const targetChild = resetNewElement(parent, newChild, app);
      const needKeepAlive = isSepcailElement(newChild) && !!app.keepAlive && !(app.container instanceof ShadowRoot);
      const container = needKeepAlive ? document.head : app?.container;
      setMarkElement(targetChild as Element, app, needKeepAlive);
      return rawMethod.call(container, targetChild);
    }
  }
  return rawMethod.call(parent, newChild);
}
export function elementInsertHandler(parent: Node, newChild: Node, passiveChild: Node | null, rawMethod: Function) {
  if (newChild.__BK_WEWEB_APP_KEY__) {
    const app = appCache.getApp(newChild.__BK_WEWEB_APP_KEY__!);
    if (app?.container) {
      const needKeepAlive = isSepcailElement(newChild) && app.keepAlive && !(app.container instanceof ShadowRoot);
      const container = needKeepAlive ? document.head : app?.container;
      const targetChild = resetNewElement(parent, newChild, app);
      if (needKeepAlive) {
        setMarkElement(targetChild as Element, app, needKeepAlive);
      }
      if (passiveChild && !container.contains(passiveChild)) {
        return bodyAppendChild.call(container, targetChild);
      }
      return rawMethod.call(container, targetChild, passiveChild);
    }
  }
  return rawMethod.call(parent, newChild, passiveChild);
}

export function setMarkElement<T extends Element>(element: T, app?: BaseModel, keepAlive?: boolean): T {
  if (keepAlive && app) {
    element.__KEEP_ALIVE__ = app.appCacheKey;
    element.setAttribute('data-from', app.name);
    element.setAttribute('data-keep-alive', 'true');
  }
  element.setAttribute?.('powered-by', 'bk-weweb');
  return element;
}
