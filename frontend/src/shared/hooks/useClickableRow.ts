/**
 * @fileoverview 클릭 가능한 테이블 행의 포커스/키보드 접근성 공용 훅
 *
 * @description
 * `<tr onClick>`만 쓰는 클릭형 행은 Tab 포커스가 가지 않고 Enter/Space로도 열 수 없다.
 * 이 훅은 행에 뿌릴 `tabIndex`/`role`/`onKeyDown`/`onClick`을 한 번에 만들어준다.
 * `TableCard`/`SelectableTableRow` 같은 공용 테이블 컴포넌트는 건드리지 않고,
 * 각 feature 테이블의 `<tr>`에 spread로 적용한다.
 */

import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

type ClickableRowProps = {
  tabIndex: number;
  role: 'button';
  'aria-label'?: string;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => void;
};

/**
 * @example
 * ```tsx
 * const { getRowProps } = useClickableRow<NoticeListRow>(onRowClick);
 *
 * rows.map((row) => (
 *   <tr key={row.id} {...getRowProps(row, `${row.title} 상세 보기`)}>
 *     ...
 *   </tr>
 * ))
 * ```
 */
export function useClickableRow<T>(onActivate: (item: T) => void) {
  const getRowProps = useCallback(
    (item: T, ariaLabel?: string): ClickableRowProps => ({
      tabIndex: 0,
      role: 'button',
      'aria-label': ariaLabel,
      onClick: () => onActivate(item),
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate(item);
        }
      },
    }),
    [onActivate],
  );

  return { getRowProps };
}
