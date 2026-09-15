/**
 * @fileoverview TreeMenu 내부 Context
 * @internal TreeMenu / TreeItem 에서만 사용. index.ts 미공개.
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { TreeMenuColumn, TreeMenuNode } from './types';


type TreeMenuContextValue = {
  expandedIds: Set<string>;
  selectedId?: string;
  columns?: TreeMenuColumn<unknown>[];
  /** 레이블 셀 커스텀 렌더. 생략 시 node.label 텍스트 */
  labelRender?: (node: TreeMenuNode<unknown>, depth: number) => ReactNode;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
};

export const TreeMenuContext = createContext<TreeMenuContextValue | null>(null);

export function useTreeMenuContext(): TreeMenuContextValue {
  const ctx = useContext(TreeMenuContext);
  if (ctx === null) throw new Error('useTreeMenuContext must be used within <TreeMenu>');
  return ctx;
}
