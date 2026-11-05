import { lazy } from 'react';
import type { ComponentType } from 'react';

/** named export로 제공되는 무인자 페이지 컴포넌트를 route 단위로 지연 로드한다. */
export function lazyNamed<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) {
  return lazy(async () => ({
    default: (await loader())[exportName] as ComponentType,
  }));
}
