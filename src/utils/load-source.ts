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

// 收集和辩证资源
export async function collectSource(soruceList: SourceType) {
  let source: string[] = [];
  if (typeof soruceList === 'function') {
    source = await soruceList();
  } else {
    source = soruceList || [];
  }
  if (!source.length) return {};
  const collectScript: Map<string, Script> = new Map();
  const collectStyle: Map<string, Style> = new Map();
  source.forEach(str => {
    try {
      const url = new URL(str);
      if (url.pathname.match(/\.js$/)) {
        const script = appCache.getCacheScript(str);
        collectScript.set(
          str,
          new Script({
            async: false,
            code: script?.code || '',
            defer: false,
            fromHtml: false,
            initial: true,
            isModule: false,
            url: str,
          }),
        );
      } else if (url.pathname.match(/\.css$/)) {
        const style = appCache.getCacheStyle(str);
        collectStyle.set(
          str,
          new Style({
            code: style?.code || '',
            fromHtml: true,
            initial: true,
            prefetch: false,
            preload: false,
            url: str,
          }),
        );
      }
    } catch {
      console.error(`【bk-weweb】: ${str} is invalid URL`);
    }
  });
  return {
    collectScript,
    collectStyle,
  };
}
// 加载全局静态资源
export async function loadGlobalSource(soruceList: SourceType) {
  const { collectScript, collectStyle } = await collectSource(soruceList);
  const promiseList: Promise<string>[] = [];
  collectScript &&
    Array.from(collectScript.entries()).forEach(item => {
      promiseList.push(item[1].getCode());
      appCache.setBaseAppScript(...item);
    });
  collectStyle &&
    Array.from(collectStyle.entries()).forEach(item => {
      promiseList.push(item[1].getCode());
      appCache.setBaseAppStyle(...item);
    });
  await Promise.all(promiseList).catch(e => {
    throw e;
  });
}
