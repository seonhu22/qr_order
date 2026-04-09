import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase, SelectInput } from '@/shared/components/input';
import type { SelectOption } from '@/shared/components/input';
import type { AdminUserRow } from '../types';

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
  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td className="admin-user-page__empty" colSpan={4}>
            관리자 목록을 불러오는 중입니다.
          </td>
        </tr>
      );
    }

    if (isError) {
      return (
        <tr>
          <td className="admin-user-page__empty" colSpan={4}>
            관리자 목록을 불러오지 못했습니다.
          </td>
        </tr>
      );
    }

    if (!rows.length) {
      return (
        <tr>
          <td className="admin-user-page__empty" colSpan={4}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr
        key={row.id}
        className={selectedRowId === row.id ? 'is-selected' : undefined}
        onClick={() => onSelectRow(row.id)}
      >
        <td>
          <InputBase
            size="sm"
            value={row.userId}
            readOnly={!row.isNew}
            controlState={rowErrors[row.id]?.userId ? 'error' : !row.isNew ? 'readonly' : ''}
            className={!row.isNew ? 'admin-user-page__input admin-user-page__input--readonly' : 'admin-user-page__input'}
            placeholder={row.isNew ? '아이디를 입력하세요' : ''}
            onChange={(event) => onChangeRowField(row.id, 'userId', event.target.value)}
          />
        </td>
        <td>
          <InputBase
            size="sm"
            value={row.userName}
            controlState={rowErrors[row.id]?.userName ? 'error' : ''}
            className="admin-user-page__input"
            placeholder="사용자 명을 입력하세요"
            onChange={(event) => onChangeRowField(row.id, 'userName', event.target.value)}
          />
        </td>
        <td>
          <SelectInput
            size="sm"
            searchable
            options={plantOptions}
            value={row.plantCd}
            placeholder="사업장을 선택하세요"
            className="admin-user-page__select"
            isError={rowErrors[row.id]?.plantCd}
            onChange={(value) => onChangeRowPlant(row.id, value)}
          />
        </td>
        <td>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="admin-user-page__password-button"
            disabled={isResettingPassword || !row.userId.trim()}
            onClick={() => onResetPassword(row.userId)}
          >
            초기화
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <article className="admin-user-page__table-card" aria-label="관리자 목록">
      <header className="admin-user-page__table-header">
        <h2 className="admin-user-page__table-title">관리자 목록</h2>

        <div className="admin-user-page__table-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Icon id="i-plus" size={13} />}
            disabled={isSaving || isResettingPassword}
            onClick={onAddRow}
          >
            행추가
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Icon id="i-minus" size={13} />}
            disabled={isSaving || isResettingPassword}
            onClick={onDeleteRow}
          >
            행삭제
          </Button>
          <Button type="button" variant="primary" size="sm" loading={isSaving} onClick={onSave}>
            저장
          </Button>
        </div>
      </header>

      <div className="admin-user-page__table-wrap">
        <table className="admin-user-page__table">
          <thead>
            <tr>
              <th>
                사용자 아이디 <span className="admin-user-page__required">*</span>
              </th>
              <th>
                사용자 명 <span className="admin-user-page__required">*</span>
              </th>
              <th>
                사업장 <span className="admin-user-page__required">*</span>
              </th>
              <th>비밀번호 초기화</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
    </article>
  );
}
