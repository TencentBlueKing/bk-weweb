/**
 * 资源加载相关类型定义
 * @description 定义了样式、脚本等资源的配置选项和相关类型
 */

/**
 * 样式资源配置选项接口
 * @description 定义样式文件的加载配置和属性信息
 */
export interface IStyleOption {
  /** 样式代码内容 */
  code: string;
  /** 是否来自 HTML 页面内联样式 */
  fromHtml: boolean;
  /** 是否为初始样式 */
  initial?: boolean;
  /** 是否预取样式资源 */
  prefetch?: boolean;
  /** 是否预加载样式资源 */
  preload?: boolean;
  /** 样式文件的 URL 地址 */
  url?: string;
}

/**
 * 脚本资源配置选项接口
 * @description 定义脚本文件的加载配置和属性信息
 */
export interface IScriptOption {
  /** 是否为异步加载脚本 */
  async: boolean;
  /** 脚本代码内容 */
  code: string;
  /** 是否为延迟执行脚本 */
  defer: boolean;
  /** 是否从 HTML 页面中提取的脚本 */
  fromHtml: boolean;
  /** 是否为初始脚本 */
  initial?: boolean;
  /** 是否为 ES6 模块类型脚本 */
  isModule: boolean;
  /** 脚本文件的 URL 地址 */
  url?: string;
}

/**
 * CSS 属性键名常量
 * @description 用于标识 CSS 样式元素的属性名
 */
export const CSS_ATTRIBUTE_KEY = 'id';

/**
 * CSS 规则类型枚举
 * @description 定义了不同类型的 CSS 规则类型常量
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule/type
 */
export enum CssRuleEnum {
  /** 样式规则 */
  STYLE_RULE = 1,
  /** @media 媒体查询规则 */
  MEDIA_RULE = 4,
  /** @supports 规则 */
  SUPPORTS_RULE = 12,
}

/**
 * 工具类型：获取对象所有值的联合类型
 * @template T - 要提取值类型的对象类型
 * @description 提取对象类型中所有属性值的联合类型
 */
export type ValueOf<T> = T[keyof T];

/**
 * Document 事件监听器类型
 * @description 定义了 Document 对象事件监听器的函数签名
 * @param this - Document 对象上下文
 * @param ev - Document 事件映射中任意事件类型的值
 * @returns 任意类型的返回值
 */
export type DocumentEventListener = (this: Document, ev: ValueOf<DocumentEventMap>) => any;
