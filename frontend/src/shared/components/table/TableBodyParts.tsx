import type { ReactNode } from 'react';

type RequiredHeaderLabelProps = {
  label: string;
};

type EmptyTableRowProps = {
  colSpan: number;
  message?: string;
};

type TableHeaderCellProps = {
  label?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
};

type SelectableTableRowProps = {
  selected?: boolean;
  onSelect?: () => void;
  selectOn?: 'click' | 'mouseDown';
  children: ReactNode;
};

/**
 * 필수 헤더 라벨 공통 조각.
 *
 * @description
 * 기존 `라벨 + *` 마크업을 그대로 재사용한다.
 */
export function RequiredHeaderLabel({ label }: RequiredHeaderLabelProps) {
  return (
    <>
      {label}
      <span style={{ color: 'var(--color-brand-default)' }}>*</span>
    </>
  );
}

/**
 * 검색 결과 없음 행 공통 조각.
 *
 * @description
 * tbody에서 반복되던 empty row 마크업을 공통화한다.
 */
export function EmptyTableRow({
  colSpan,
  message = '데이터가 없습니다.',
}: EmptyTableRowProps) {
  return (
    <tr>
      <td className="common-table__empty" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  );
}

/**
 * 공통 헤더 셀.
 *
 * @description
 * `th + required label` 패턴을 공통화한다.
 * 필요하면 children으로 완전히 커스텀한 헤더 내용도 전달할 수 있다.
 */
export function TableHeaderCell({
  label,
  required = false,
  className,
  ariaLabel,
  children,
}: TableHeaderCellProps) {
  return (
    <th className={className} aria-label={ariaLabel}>
      {children ?? (required && label ? <RequiredHeaderLabel label={label} /> : label)}
    </th>
  );
}

/**
 * 선택 가능한 테이블 행.
 *
 * @description
 * 기존의 `is-selected` 클래스와 선택 이벤트만 공통화한다.
 * 이벤트 트리거는 click / mouseDown 중 호출부가 고른다.
 */
export function SelectableTableRow({
  selected = false,
  onSelect,
  selectOn = 'click',
  children,
}: SelectableTableRowProps) {
  const eventProps =
    onSelect == null
      ? undefined
      : selectOn === 'mouseDown'
        ? { onMouseDown: onSelect }
        : { onClick: onSelect };

  return (
    <tr
      className={selected ? 'is-selected' : undefined}
      aria-selected={onSelect == null ? undefined : selected}
      {...eventProps}
    >
      {children}
    </tr>
  );
}
