import type { KeyboardEvent, ReactNode } from 'react';

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
 * `onSelect`가 있으면 체크박스·수정 버튼 같은 행 내부 다른 포커스 요소와 별개로
 * 행 자체도 Tab/Enter/Space로 선택할 수 있어야 하므로 `tabIndex`/`role="button"`을 추가한다.
 */
export function SelectableTableRow({
  selected = false,
  onSelect,
  selectOn = 'click',
  children,
}: SelectableTableRowProps) {
  if (onSelect == null) {
    return <tr className={selected ? 'is-selected' : undefined}>{children}</tr>;
  }

  const eventProps = selectOn === 'mouseDown' ? { onMouseDown: onSelect } : { onClick: onSelect };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    // 체크박스·수정 버튼 같은 행 내부 다른 포커스 요소에서 올라온(bubble) 키 입력은 무시한다.
    // 무시하지 않으면 preventDefault가 그 요소의 기본 Enter/Space 동작(버튼 클릭 등)을 막아버린다.
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <tr
      className={selected ? 'is-selected' : undefined}
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
      {...eventProps}
    >
      {children}
    </tr>
  );
}
