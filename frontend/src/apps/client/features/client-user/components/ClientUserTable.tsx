/**
 * @fileoverview 클라이언트 유저 정보 목록 테이블
 *
 * @description
 * - 표시 + 입력 이벤트 전달만 담당한다.
 * - 신규/삭제, 행 선택, 비밀번호 초기화, 수정 흐름은 페이지에서 주입한다.
 */

import './ClientUserTable.css';
import { TableBodyRenderer, TableCard, TableCardContentState } from '@/shared/components/table';
import { CreateTableButton, DeleteTableButton } from '@/shared/components/button';
import type { ClientUser } from '../types';
import {
  createClientUserHeaderOverrides,
  createClientUserTableColumns,
  createClientUserTableRows,
} from './clientUserTableModel';

type ClientUserTableProps = {
  rows: ClientUser[];
  selectedRowIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onCreate: () => void;
  onDelete: () => void;
  onResetPassword: (userId: string) => void;
  onEdit: (rowId: string) => void;
};

export function ClientUserTable({
  rows,
  selectedRowIds,
  isLoading,
  isError,
  onToggleRow,
  onToggleAll,
  onCreate,
  onDelete,
  onResetPassword,
  onEdit,
}: ClientUserTableProps) {
  const allChecked = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.id));
  const hasSelection = selectedRowIds.size > 0;

  const columns = createClientUserTableColumns();
  const headerOverrides = createClientUserHeaderOverrides({ allChecked, onToggleAll });
  const tableRows = createClientUserTableRows({
    rows,
    selectedRowIds,
    onToggleRow,
    onResetPassword,
    onEdit,
  });

  return (
    <TableCard
      title="유저 정보 목록"
      ariaLabel="유저 정보 목록"
      actions={
        <>
          <CreateTableButton onClick={onCreate} />
          <DeleteTableButton onClick={onDelete} disabled={!hasSelection} />
        </>
      }
      className="client-user-table"
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="유저 정보 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer
          tableAriaLabel="유저 정보 목록 테이블"
          columns={columns}
          rows={tableRows}
          headerCellOverrides={headerOverrides}
          emptyMessage="조회된 유저가 없습니다."
        />
      </TableCardContentState>
    </TableCard>
  );
}
