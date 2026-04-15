/**
 * @fileoverview 관리자 관리 목록 테이블 컴포넌트
 *
 * @description
 * - 이 컴포넌트는 "표시 + 입력 이벤트 전달"만 담당한다.
 * - 저장/조회/삭제/초기화 모달 흐름은 상위 훅(useAdminUserFlow)에서 담당한다.
 *
 * @remarks
 * 핵심 렌더링 규칙:
 * - 기존 행(isNew=false)의 사용자 아이디는 readonly
 * - 신규 행(isNew=true)의 사용자 아이디는 editable
 * - rowErrors에 따라 input/select를 error 상태로 렌더링
 * - selectedRowId와 일치하는 행은 is-selected 스타일 적용
 */

import type { SelectOption } from '@/shared/components/input';
import {
  EditableTableActions,
  TableBodyRenderer,
  TableCard,
  TableCardContentState,
} from '@/shared/components/table';
import type { AdminUserRow } from '../types';
import {
  createAdminUserTableColumns,
  createAdminUserTableRows,
} from './adminUserTableModel';

type AdminUserTableProps = {
  rows: AdminUserRow[];
  selectedRowId: string;
  plantOptions: SelectOption[];
  rowErrors: Record<string, { userId: boolean; userName: boolean; plantCd: boolean }>;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  isResettingPassword: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, key: 'userId' | 'userName', value: string) => void;
  onChangeRowPlant: (rowId: string, plantCd: string) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
  onResetPassword: (userId: string) => void;
};

/**
 * 관리자 목록 테이블
 */
export function AdminUserTable({
  rows,
  selectedRowId,
  plantOptions,
  rowErrors,
  isLoading,
  isError,
  isSaving,
  isResettingPassword,
  onSelectRow,
  onChangeRowField,
  onChangeRowPlant,
  onAddRow,
  onDeleteRow,
  onSave,
  onResetPassword,
}: AdminUserTableProps) {
  const columns = createAdminUserTableColumns();
  const tableRows = createAdminUserTableRows({
    rows,
    selectedRowId,
    plantOptions,
    rowErrors,
    isResettingPassword,
    onSelectRow,
    onChangeRowField,
    onChangeRowPlant,
    onResetPassword,
  });

  return (
    <TableCard
      title="관리자 목록"
      ariaLabel="관리자 목록"
      actions={
        <EditableTableActions
          isSaving={isSaving}
          canDelete={!!selectedRowId}
          onAddRow={onAddRow}
          onDeleteRow={onDeleteRow}
          onSave={onSave}
        />
      }
      className="admin-user-table"
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="관리자 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer tableAriaLabel="관리자 목록 테이블" columns={columns} rows={tableRows} />
      </TableCardContentState>
    </TableCard>
  );
}
