import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { FeedbackState } from '@/shared/components/feedback';
import type { AdminUserRow } from '../types';

type AdminUserTableProps = {
  rows: AdminUserRow[];
  isLoading: boolean;
  isError: boolean;
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
  isLoading,
  isError,
  onAddRow,
  onDeleteRow,
  onSave,
  onResetPassword,
}: AdminUserTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4}>
            <FeedbackState variant="loading" title="관리자 목록을 불러오는 중입니다." />
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
      <tr key={row.id}>
        <td className="admin-user-page__mono">{row.userId}</td>
        <td>{row.userName}</td>
        <td>{row.plantName}</td>
        <td>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="admin-user-page__password-button"
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
            onClick={onAddRow}
          >
            행추가
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Icon id="i-minus" size={13} />}
            onClick={onDeleteRow}
          >
            행삭제
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onSave}>
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
