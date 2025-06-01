export * from './global';
export * from './source';
export * from './model';
export * from './sandbox';

export type FetchSourceType = (url: string, options: Record<string, unknown>) => Promise<string>;
export interface IStartOption {
  collectBaseSource?: boolean;
  fetchSource?: FetchSourceType;
  webComponentTag?: string;
}
