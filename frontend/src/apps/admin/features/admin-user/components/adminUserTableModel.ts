import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { SelectOption } from '@/shared/components/input';
import type { AdminUserRow } from '../types';

type CreateAdminUserTableModelParams = {
  rows: AdminUserRow[];
  selectedRowId: string;
  plantOptions: SelectOption[];
  rowErrors: Record<string, { userId: boolean; userName: boolean; plantCd: boolean }>;
  isResettingPassword: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, key: 'userId' | 'userName', value: string) => void;
  onChangeRowPlant: (rowId: string, plantCd: string) => void;
  onResetPassword: (userId: string) => void;
};

/**
 * 관리자 사용자 테이블의 컬럼 정보를 생성합니다.
 * @returns 테이블 컬럼 배열
 */
export function createAdminUserTableColumns(): SharedTableColumn[] {
  return [
    { key: 'userId', label: '사용자 아이디', required: true },
    { key: 'userName', label: '사용자 명', required: true },
    { key: 'plantCd', label: '사업장', required: true },
    { key: 'passwordReset', label: '비밀번호 초기화' },
  ];
}

/**
 * 관리자 사용자 테이블의 행 데이터를 생성합니다.
 * @param rows - 관리자 사용자 행 데이터 배열
 * @param selectedRowId - 선택된 행의 ID
 * @param plantOptions - 사업장 선택지 배열
 * @param rowErrors - 행별 오류 정보
 * @param isResettingPassword - 비밀번호 초기화 중 여부
 * @param onSelectRow - 행 선택 콜백
 * @param onChangeRowField - 행 필드 변경 콜백
 * @param onChangeRowPlant - 행 사업장 변경 콜백
 * @param onResetPassword - 비밀번호 초기화 콜백
 * @returns 테이블 행 배열
 */
export function createAdminUserTableRows({
  rows,
  selectedRowId,
  plantOptions,
  rowErrors,
  isResettingPassword,
  onSelectRow,
  onChangeRowField,
  onChangeRowPlant,
  onResetPassword,
}: CreateAdminUserTableModelParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowId === row.id,
    selectOn: 'mouseDown',
    onSelect: () => onSelectRow(row.id),
    cells: {
      userId: {
        type: 'input',
        inputId: `${row.id}-user-id`,
        value: row.userId,
        readOnly: !row.isNew,
        controlState: !row.isNew ? 'readonly' : rowErrors[row.id]?.userId ? 'error' : '',
        className: !row.isNew
          ? 'common-table__input common-table__input--readonly'
          : 'common-table__input',
        ariaLabel: `${row.id} 사용자 아이디`,
        placeholder: row.isNew ? '아이디를 입력하세요' : '',
        onChange: (value) => onChangeRowField(row.id, 'userId', value),
      },
      userName: {
        type: 'input',
        inputId: `${row.id}-user-name`,
        value: row.userName,
        controlState: rowErrors[row.id]?.userName ? 'error' : '',
        className: 'common-table__input',
        ariaLabel: `${row.id} 사용자 명`,
        placeholder: '사용자 명을 입력하세요',
        onChange: (value) => onChangeRowField(row.id, 'userName', value),
      },
      plantCd: {
        type: 'select',
        value: row.plantCd,
        searchable: true,
        options: plantOptions,
        placeholder: '사업장을 선택하세요',
        className: 'common-table__select',
        isError: rowErrors[row.id]?.plantCd,
        onChange: (value) => onChangeRowPlant(row.id, value),
      },
      passwordReset: {
        type: 'passwordResetButton',
        disabled: isResettingPassword || !row.userId.trim(),
        onClick: () => onResetPassword(row.userId),
      },
    },
  }));
}
