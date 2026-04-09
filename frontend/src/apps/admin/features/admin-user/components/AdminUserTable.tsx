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
  /**
   * tbody 렌더 분기.
   *
   * @description
   * 조회 상태/오류/빈 상태/정상 목록을 한 함수에서 관리해
   * return JSX 본문을 단순화한다.
   */
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
          {/* 기존 행은 readonly, 신규 행만 사용자 아이디 수정 가능 */}
          <InputBase
            size="sm"
            value={row.userId}
            readOnly={!row.isNew}
            controlState={rowErrors[row.id]?.userId ? 'error' : !row.isNew ? 'readonly' : ''}
            className={
              !row.isNew
                ? 'admin-user-page__input admin-user-page__input--readonly'
                : 'admin-user-page__input'
            }
            placeholder={row.isNew ? '아이디를 입력하세요' : ''}
            onChange={(event) => onChangeRowField(row.id, 'userId', event.target.value)}
          />
        </td>
        <td>
          {/* 필수값 누락 시 userName error 상태 표시 */}
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
          {/* 필수값 누락 시 plantCd error 상태 표시 */}
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
