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
 * 加载生命周期模块
 * @description 提供微应用和模块实例的加载功能，支持不同模式的资源加载和状态管理
 */

import { appCache } from '../cache/app-cache';
import { AppState } from '../common';
import { MicroAppModel } from '../mode/app';
import { MicroInstanceModel } from '../mode/instance';
import { type BaseModel, type IAppModelProps, type IBaseModelProps, type IJsModelProps, WewebMode } from '../typings';
import { beforeLoad } from './before-load';

/**
 * 应用状态检查间隔时间（毫秒）
 */
const STATUS_CHECK_INTERVAL = 300;

/**
 * 根据配置模式加载相应的应用或模块实例
 * @description 统一的加载入口，根据模式参数决定加载应用还是模块实例
 * @param props - 基础模型配置参数
 * @returns Promise<BaseModel> - 返回加载的模型实例
 */
export async function load(props: IBaseModelProps): Promise<BaseModel> {
  beforeLoad();

  if (props.mode === WewebMode.INSTANCE) {
    return await loadInstance(props);
  }

  return await loadApp(props);
}

/**
 * 加载微应用
 * @description 加载或获取已存在的微应用实例，并启动应用
 * @param props - 应用模型配置参数
 * @returns Promise<MicroAppModel> - 返回微应用模型实例
 */
export async function loadApp(props: IAppModelProps): Promise<MicroAppModel> {
  beforeLoad();

  let instance = appCache.getApp(props.id);

  if (!instance) {
    instance = new MicroAppModel(props);
    appCache.setApp(instance);
  }

  await instance.start();
  return instance as MicroAppModel;
}

/**
 * 加载模块实例
 * @description 加载或获取已存在的模块实例，支持状态监听和异步等待
 * @param props - 模块实例配置参数
 * @returns Promise<MicroInstanceModel> - 返回模块实例模型
 */
export function loadInstance(props: IJsModelProps): Promise<MicroInstanceModel> {
  beforeLoad();

  return new Promise(resolve => {
    let instance = appCache.getApp(props.id);

    // 如果实例不存在，创建新实例
    if (!instance) {
      instance = new MicroInstanceModel(props);
      appCache.setApp(instance);
      instance.start().then(() => resolve(instance as MicroInstanceModel));
      return;
    }

    // 如果实例正在挂载或未设置状态，等待状态变更
    if (instance.status in [AppState.MOUNTING, AppState.UNSET]) {
      const timer = setInterval(() => {
        if (instance.status in [AppState.ERROR, AppState.MOUNTED]) {
          resolve(instance as MicroInstanceModel);
          clearInterval(timer);
        }
      }, STATUS_CHECK_INTERVAL);
      return;
    }

    // 实例已存在且状态正常，直接返回
    resolve(instance as MicroInstanceModel);
  });
}
