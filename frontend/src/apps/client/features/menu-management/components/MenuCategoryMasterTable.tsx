import { MasterTableActions } from '@/shared/components/table/TableActionGroups';
import { TableBodyRenderer } from '@/shared/components/table/TableBodyRenderer';
import { TableCard } from '@/shared/components/table/TableCard';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table/tableModelTypes';
import type { MenuCategoryRow } from '../types';

type MenuCategoryMasterTableProps = {
  rows: MenuCategoryRow[];
  isLoading: boolean;
  isError: boolean;
  selectedId: string;
  checkedIds: string[];
  isAllChecked: boolean;
  onSelectRow: (id: string) => void;
  onToggleRow: (id: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: MenuCategoryRow) => void;
  onDelete: () => void;
};

const COLUMNS: SharedTableColumn[] = [
  { key: 'select', ariaLabel: '카테고리 목록 전체 선택' },
  { key: 'name', label: '카테고리명' },
  { key: 'useYn', label: '사용여부' },
  { key: 'edit', ariaLabel: '수정' },
];

export function MenuCategoryMasterTable({
  rows,
  isLoading,
  isError,
  selectedId,
  checkedIds,
  isAllChecked,
  onSelectRow,
  onToggleRow,
  onToggleAllRows,
  onCreate,
  onEdit,
  onDelete,
}: MenuCategoryMasterTableProps) {
  const tableRows: SharedTableRow[] = rows.map((row) => ({
    id: row.id,
    selected: selectedId === row.id,
    onSelect: () => onSelectRow(row.id),
    cells: {
      select: {
        type: 'checkbox',
        checked: checkedIds.includes(row.id),
        ariaLabel: `${row.name} 선택`,
        onChange: () => onToggleRow(row.id),
      },
      name: {
        type: 'text',
        value: row.name,
        title: row.name,
      },
      useYn: {
        type: 'custom',
        render: () => (
          <span
            className={`menu-category-use-yn-badge menu-category-use-yn-badge--${
              row.useYn === 'Y' ? 'active' : 'inactive'
            }`}
          >
            {row.useYn === 'Y' ? '사용' : '미사용'}
          </span>
        ),
      },
      edit: {
        type: 'editButton',
        ariaLabel: `${row.name} 수정`,
        onClick: (event) => {
          event.stopPropagation();
          onEdit(row);
        },
      },
    },
  }));

  return (
    <TableCard
      title="카테고리 목록"
      ariaLabel="카테고리 목록"
      actions={<MasterTableActions onCreate={onCreate} onDelete={onDelete} />}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="카테고리 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer
          tableAriaLabel="카테고리 목록 테이블"
          columns={COLUMNS}
          rows={tableRows}
          emptyMessage="조회 결과가 없습니다."
          colGroup={
            <colgroup>
              <col className="common-table__col--checkbox" />
              <col />
              <col className="common-table__col--md" />
              <col className="common-table__col--action" />
            </colgroup>
          }
          headerCellOverrides={{
            select: {
              type: 'checkbox',
              checked: isAllChecked,
              ariaLabel: '카테고리 목록 전체 선택',
              onChange: onToggleAllRows,
            },
          }}
        />
      </TableCardContentState>
    </TableCard>
  );
}
