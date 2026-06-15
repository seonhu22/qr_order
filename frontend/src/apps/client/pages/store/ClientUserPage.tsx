/**
 * @fileoverview 매장 > 유저 관리 > 유저 정보 관리 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 실제 상태 계산과 UX 플로우는 `useClientUserPage` feature hook에서 처리한다.
 */

import './ClientUserPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { ConfirmModal, DeleteConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { ClientUserTable } from '@/apps/client/features/client-user/components/ClientUserTable';
import { useClientUserPage } from '@/apps/client/features/client-user/hooks/useClientUserPage';

export function ClientUserPage() {
  const { data, status, actions, uiProps } = useClientUserPage();

  return (
    <section className="client-user-page" aria-label="유저 정보 관리">
      <SearchFilterCard
        ariaLabel="유저 검색"
        inputId="client-user-search-keyword"
        inputAriaLabel="유저 검색어"
        placeholder="아이디, 이름 명으로 검색"
        draftKeyword={uiProps.draftKeyword}
        onKeywordChange={actions.handleKeywordChange}
        onSearch={actions.handleSearch}
        onReset={actions.handleReset}
      />

      <ClientUserTable
        rows={data.rows}
        selectedRowIds={uiProps.selectedRowIds}
        onToggleRow={actions.handleToggleRow}
        onToggleAll={actions.handleToggleAll}
        onCreate={actions.handleCreate}
        onDelete={actions.handleDelete}
        onResetPassword={actions.handleResetPassword}
        onEdit={actions.handleEdit}
      />

      <DeleteConfirmModal
        open={uiProps.isDeleteConfirmOpen}
        title="삭제하시겠습니까?"
        description={
          uiProps.selectedDeleteCount > 1
            ? `선택한 ${uiProps.selectedDeleteCount}건의 항목을 삭제하면 복구할 수 없습니다.`
            : '선택한 항목을 삭제하면 복구할 수 없습니다.'
        }
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{ label: '확인', loading: status.isDeleting, onClick: actions.confirmDelete }}
        secondaryAction={{ disabled: status.isDeleting, onClick: actions.closeDeleteConfirm }}
        onClose={actions.closeDeleteConfirm}
      />

      <ConfirmModal
        open={uiProps.passwordResetTarget !== null}
        tone="info"
        title="비밀번호를 초기화 하시겠습니까?"
        description={`${uiProps.passwordResetTarget?.userId ?? ''} 비밀번호를 초기화 하시겠습니까?`}
        primaryAction={{ loading: status.isResettingPassword, onClick: actions.confirmResetPassword }}
        secondaryAction={{ disabled: status.isResettingPassword, onClick: actions.closePasswordResetConfirm }}
        onClose={actions.closePasswordResetConfirm}
      />

      <SimpleDefaultModal
        open={!!uiProps.noticeState}
        title={uiProps.noticeState?.title ?? '알림'}
        description={uiProps.noticeState?.description}
        onClose={actions.closeNotice}
      />
    </section>
  );
}
