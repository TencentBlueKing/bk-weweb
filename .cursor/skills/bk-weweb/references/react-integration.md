# React 集成指南

## 组件封装

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { loadApp, mount, unmount, activated, deactivated } from '@blueking/bk-weweb';

interface MicroAppProps {
  appId: string;
  url: string;
  data?: Record<string, unknown>;
  keepAlive?: boolean;
  scopeJs?: boolean;
  scopeCss?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MicroApp: React.FC<MicroAppProps> = ({
  appId,
  url,
  data,
  keepAlive = false,
  scopeJs = true,
  scopeCss = true,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMicroApp = async () => {
      try {
        await loadApp({
          url,
          id: appId,
          scopeJs,
          scopeCss,
          keepAlive,
          data,
        });

        if (containerRef.current) {
          if (keepAlive) {
            activated(appId, containerRef.current);
          } else {
            mount(appId, containerRef.current);
          }
        }
        setLoading(false);
      } catch (e) {
        setError(e as Error);
        setLoading(false);
      }
    };

    loadMicroApp();

    return () => {
      if (keepAlive) {
        deactivated(appId);
      } else {
        unmount(appId);
      }
    };
  }, [appId, url, scopeJs, scopeCss, keepAlive]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>加载失败: {error.message}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: '100px', ...style }}
    />
  );
};
```

## 自定义 Hook

```tsx
// useMicroApp.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import { loadApp, mount, unmount } from '@blueking/bk-weweb';

interface UseMicroAppOptions {
  url: string;
  id: string;
  scopeJs?: boolean;
  scopeCss?: boolean;
  data?: Record<string, unknown>;
}

export function useMicroApp(options: UseMicroAppOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await loadApp({
        url: options.url,
        id: options.id,
        scopeJs: options.scopeJs ?? true,
        scopeCss: options.scopeCss ?? true,
        data: options.data,
      });

      if (containerRef.current) {
        mount(options.id, containerRef.current);
      }
      setLoading(false);
    } catch (e) {
      setError(e as Error);
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    reload();
    return () => unmount(options.id);
  }, [options.id, options.url]);

  return {
    containerRef,
    loading,
    error,
    reload,
  };
}
```

## 使用示例

```tsx
import React from 'react';
import { MicroApp } from './MicroApp';

const Dashboard: React.FC = () => {
  return (
    <div className='dashboard'>
      <h1>主应用</h1>
      <MicroApp
        appId='child-app'
        url='http://localhost:8001/'
        data={{ userId: '123', token: 'xxx' }}
        scopeJs
        scopeCss
        style={{ border: '1px solid #eee' }}
      />
    </div>
  );
};
```

## 带路由的使用

```tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MicroApp } from './MicroApp';

const MicroAppPage: React.FC = () => {
  const location = useLocation();

  return (
    <MicroApp
      appId='routed-app'
      url='http://localhost:8001/'
      scopeLocation // 开启路由隔离
      data={{
        basePath: location.pathname,
        query: location.search,
      }}
    />
  );
};
```
