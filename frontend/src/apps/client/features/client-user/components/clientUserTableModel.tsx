/**
 * @fileoverview 클라이언트 유저 테이블의 컬럼/행 모델 생성기
 *
 * @description
 * 표시 전용 모델만 만든다. 이벤트 핸들러는 페이지에서 주입한다.
 */

import type { SharedTableCell, SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { ClientUser } from '../types';

type CreateClientUserTableRowsParams = {
  rows: ClientUser[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string, checked: boolean) => void;
  onResetPassword: (userId: string) => void;
  onEdit: (rowId: string) => void;
};

export function createClientUserTableColumns(): SharedTableColumn[] {
  return [
    { key: 'check', label: '', className: 'common-table__col--checkbox', ariaLabel: '선택' },
    { key: 'userId', label: '아이디', className: 'client-user-table__col--id' },
    { key: 'userName', label: '이름', className: 'client-user-table__col--name' },
    { key: 'authority', label: '권한', className: 'client-user-table__col--authority' },
    { key: 'passwordReset', label: '비밀번호 초기화', className: 'common-table__col--md' },
    { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
  ];
}

export function createClientUserHeaderOverrides({
  allChecked,
  onToggleAll,
}: {
  allChecked: boolean;
  onToggleAll: (checked: boolean) => void;
}): Partial<Record<string, SharedTableCell>> {
  return {
    check: {
      type: 'checkbox',
      checked: allChecked,
      ariaLabel: '전체 선택',
      onChange: onToggleAll,
    },
  };
}

export function createClientUserTableRows({
  rows,
  selectedRowIds,
  onToggleRow,
  onResetPassword,
  onEdit,
}: CreateClientUserTableRowsParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    cells: {
      check: {
        type: 'checkbox',
        checked: selectedRowIds.has(row.id),
        ariaLabel: `${row.userId} 선택`,
        onChange: (checked) => onToggleRow(row.id, checked),
      },
      userId: {
        type: 'text',
        value: row.userId,
        className: 'client-user-table__id-text',
      },
      userName: {
        type: 'text',
        value: row.userName,
      },
      authority: {
        type: 'authorityBadge',
        code: row.authorityCode,
        label: row.authorityLabel,
      },
      passwordReset: {
        type: 'passwordResetButton',
        onClick: () => onResetPassword(row.userId),
      },
      edit: {
        type: 'editButton',
        ariaLabel: `${row.userId} 수정`,
        onClick: () => onEdit(row.id),
      },
    },
  }));
}
