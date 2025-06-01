import type { AppCache } from '../cache/app-cache';
import type { BaseModel } from './model';

declare global {
  interface Window {
    __BK_WEWEB_APP_KEY__?: string;
    __POWERED_BY_BK_WEWEB__?: boolean;
    __getAppOrInstance__(id?: string): AppCache | BaseModel | undefined;
  }
  interface Node {
    __BK_WEWEB_APP_KEY__?: string;
    __KEEP_ALIVE__?: string;
    data?: unknown;
  }
}
