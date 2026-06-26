import { TableBodyRenderer } from '@/shared/components/table/TableBodyRenderer';
import { TableCard } from '@/shared/components/table/TableCard';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table/tableModelTypes';
import type { MenuOptionMasterRow } from '../types';

type MenuOptionMasterTableProps = {
  rows: MenuOptionMasterRow[];
  isLoading: boolean;
  isError: boolean;
  selectedId: string;
  onSelectRow: (id: string) => void;
};

const COLUMNS: SharedTableColumn[] = [{ key: 'name', label: '메뉴명' }];

/**
 * 옵션 설정 대상 메뉴 목록. 등록/삭제 버튼이 없고, 행 클릭이 곧 선택 동작이다.
 */
export function MenuOptionMasterTable({
  rows,
  isLoading,
  isError,
  selectedId,
  onSelectRow,
}: MenuOptionMasterTableProps) {
  const tableRows: SharedTableRow[] = rows.map((row) => ({
    id: row.id,
    selected: selectedId === row.id,
    onSelect: () => onSelectRow(row.id),
    cells: {
      name: { type: 'text', value: row.name, title: row.name },
    },
  }));

  return (
    <TableCard title="메뉴 목록" ariaLabel="메뉴 목록">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="메뉴 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer
          tableAriaLabel="메뉴 목록 테이블"
          columns={COLUMNS}
          rows={tableRows}
          emptyMessage="조회 결과가 없습니다."
        />
      </TableCardContentState>
    </TableCard>
  );
}
