/**
 * 沙箱环境配置类型定义
 */

/**
 * 注入到子应用 window 对象的属性接口
 * @description 定义了 BK WEWEB 平台注入到子应用环境中的必要属性
 */
export interface IInjectWindowAttrs {
  /** BK WEWEB平台的应用唯一标识 */
  __BK_WEWEB_APP_KEY__: string;
  /** BK WEWEB的附加数据 */
  __BK_WEWEB_DATA__: Record<string, unknown>;
  /** 标识页面是否由BK WEWEB驱动 */
  __POWERED_BY_BK_WEWEB__: boolean;
  /** 原始 document 对象的引用 */
  rawDocument: Document;
  /** 原始 window 对象的引用 */
  rawWindow: Window;
}

/**
 * 沙箱环境白名单配置
 * @description 允许子应用访问的 window 属性列表
 */
export const WINDOW_WHITE_LIST: readonly PropertyKey[] = [
  'System', // SystemJS 模块加载器
  '__cjsWrapper', // SystemJS CommonJS 包装器
  // 开发环境下允许 React DevTools
  ...(process.env.NODE_ENV !== 'production' ? ['__REACT_DEVTOOLS_GLOBAL_HOOK__'] : []),
] as const;

/**
 * BK WEWEB 注入属性列表
 * @description 需要在子应用自身上下文中获取的 BK WEWEB 相关属性
 */
export const BK_WEWEB_INJECT_KEY_LIST: readonly PropertyKey[] = [
  '__POWERED_BY_BK_WEWEB__',
  '__BK_WEWEB_APP_KEY__',
  '__BK_WEWEB_DATA__',
] as const;

/**
 * Window 对象别名列表
 * @description 在沙箱环境中需要处理的 window 对象的所有别名
 */
export const WINDOW_ALIAS_LIST: readonly PropertyKey[] = ['window', 'self', 'globalThis'] as const;

/**
 * 路由相关属性列表
 * @description 设置了 scopedLocation 后需要监听的路由相关属性
 */
export const BK_WEWEB_LOCATION_KEY_LIST: readonly PropertyKey[] = ['location', 'history'] as const;

/**
 * 通用微应用 Window 键映射
 * @description 所有环境下都需要的微应用相关的 window 属性
 */
const COMMON_MICRO_APP_WINDOW_KEY_MAP = {
  __bk_pop_manager: true,
  __bk_zIndex_manager: true,
  i18n: true,
} as const;

/**
 * 开发环境微应用 Window 键映射
 * @description 根据环境动态生成的微应用 window 属性映射表
 */
export const DEV_MICRO_APP_WINDOW_KEY_MAP: Record<PropertyKey, true> =
  process.env.NODE_ENV !== 'production'
    ? {
        // 开发环境标识
        __DEV__: true,

        // Vue DevTools 相关
        __VUE_DEVTOOLS_GLOBAL_HOOK__: true,
        __VUE_DEVTOOLS_HOOK_REPLAY__: true,
        __VUE_DEVTOOLS_PLUGINS__: true,

        // Vue I18n 相关
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: true,

        // Vue 配置相关
        __VUE_OPTIONS_API__: true,

        // Core-js 相关
        '__core-js_shared__': true,

        // Webpack 相关
        webpackChunkapm: true,
        webpackChunkpc: true,
        webpackChunktrace: true,
        webpackJsonp: true,

        // 包含通用配置
        ...COMMON_MICRO_APP_WINDOW_KEY_MAP,
      }
    : COMMON_MICRO_APP_WINDOW_KEY_MAP;
