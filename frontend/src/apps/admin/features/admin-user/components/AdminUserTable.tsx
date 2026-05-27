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

import { useEffect, useRef } from 'react';
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
  /**
   * 행추가 버튼으로 발생한 선택 변경인지 추적한다.
   * 클릭 선택과 달리 행추가 직후에만 스크롤해야 하므로 플래그로 구분한다.
   */
  const shouldScrollRef = useRef(false);
  /** 테이블 본문 영역의 DOM 참조. 선택 행 스크롤 대상을 좁히기 위해 사용한다. */
  const tableRef = useRef<HTMLDivElement>(null);

  /**
   * 행추가로 새 행이 DOM에 반영된 뒤 해당 행이 보이도록 스크롤한다.
   * shouldScrollRef가 true일 때(행추가 직후)에만 실제로 스크롤한다.
   */
  useEffect(() => {
    if (!shouldScrollRef.current || !selectedRowId || !tableRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = tableRef.current.querySelector('tr.is-selected');
    selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedRowId]);

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
          onAddRow={() => {
            shouldScrollRef.current = true;
            onAddRow();
          }}
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
        <div ref={tableRef} className="layout-contents">
          <TableBodyRenderer tableAriaLabel="관리자 목록 테이블" columns={columns} rows={tableRows} emptyMessage="조회 결과가 없습니다." />
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
