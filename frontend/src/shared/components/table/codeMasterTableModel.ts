import type { SharedTableCell, SharedTableColumn, SharedTableRow } from './tableModelTypes';
import type { EditableMasterRow } from './editableTableTypes';

/**
 * 이 컴포넌트는 마스터 CRUD 화면에서 사용하는 테이블을 공통화한 것이다.
 */

type CreateCodeMasterTableRowsParams<T extends EditableMasterRow> = {
  rows: T[];
  title: string;
  selectedMasterId: string;
  checkedMasterIds: string[];
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onEdit: (row: T) => void;
};

/**
 * 코드 마스터 목록 테이블의 고정 컬럼 정의를 생성한다.
 */
export function createCodeMasterTableColumns({
  title,
  codeLabel,
  nameLabel,
}: {
  title: string;
  codeLabel: string;
  nameLabel: string;
}): SharedTableColumn[] {
  return [
    {
      key: 'select',
      ariaLabel: `${title} 전체 선택`,
    },
    {
      key: 'code',
      label: codeLabel,
      align: 'left',
    },
    {
      key: 'name',
      label: nameLabel,
      align: 'left',
    },
    {
      key: 'useYn',
      label: '사용여부',
    },
    {
      key: 'edit',
      ariaLabel: '수정',
    },
  ];
}

/**
 * 코드 마스터 도메인 행 데이터를 공통 테이블 렌더링 모델로 변환한다.
 */
export function createCodeMasterTableRows<T extends EditableMasterRow>({
  rows,
  selectedMasterId,
  checkedMasterIds,
  onSelectRow,
  onToggleRow,
  onEdit,
}: CreateCodeMasterTableRowsParams<T>): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedMasterId === row.id,
    onSelect: () => onSelectRow(row.id),
    cells: {
      select: {
        type: 'checkbox',
        checked: checkedMasterIds.includes(row.id),
        ariaLabel: `${row.code} 선택`,
        onChange: () => onToggleRow(row.id),
      },
      code: {
        type: 'text',
        value: row.code,
        className: 'common-table__mono common-table__cell--left',
        title: row.code,
      },
      name: {
        type: 'text',
        value: row.name,
        className: 'common-table__cell--left',
        title: row.name,
      },
      useYn: {
        type: 'useYnBadge',
        value: row.useYn,
      },
      edit: {
        type: 'editButton',
        ariaLabel: `${row.code} 수정`,
        onClick: (event) => {
          event.stopPropagation();
          onEdit(row);
        },
      },
    },
  }));
}

/**
 * 코드 마스터 테이블 헤더에서 전체 선택 체크박스 셀을 오버라이드한다.
 */
export function createCodeMasterHeaderCellOverrides({
  title,
  isAllChecked,
  onToggleAllRows,
}: {
  title: string;
  isAllChecked: boolean;
  onToggleAllRows: () => void;
}): Partial<Record<string, SharedTableCell>> {
  return {
    select: {
      type: 'checkbox',
      checked: isAllChecked,
      ariaLabel: `${title} 전체 선택`,
      onChange: onToggleAllRows,
    },
  };
}
