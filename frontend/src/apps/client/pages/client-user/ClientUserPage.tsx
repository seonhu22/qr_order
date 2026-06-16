/**
 * @fileoverview 매장 > 유저 관리 > 유저 정보 관리 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 실제 상태 계산과 UX 플로우는 `useClientUserPage` feature hook에서 처리한다.
 */

import './ClientUserPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TextInput, SelectInput } from '@/shared/components/input';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
  WrapperModal,
} from '@/shared/components/modal';
import { ClientUserTable } from '@/apps/client/features/client-user/components/ClientUserTable';
import { CLIENT_USER_AUTHORITY_OPTIONS } from '@/apps/client/features/client-user/constants';
import { useClientUserPage } from '@/apps/client/features/client-user/hooks/useClientUserPage';

export function ClientUserPage() {
  const { data, status, actions, uiProps } = useClientUserPage();

  return (
    <>
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
          isLoading={status.isLoading}
          isError={status.isError}
          onToggleRow={actions.handleToggleRow}
          onToggleAll={actions.handleToggleAll}
          onCreate={actions.handleCreate}
          onDelete={actions.handleDelete}
          onResetPassword={actions.handleResetPassword}
          onEdit={actions.handleEdit}
        />
      </section>

      {/* ── 유저 등록/수정 에디터 모달 ── */}
      <WrapperModal
        open={uiProps.editor.open}
        isDirty={uiProps.editor.isDirty}
        title={uiProps.editor.isCreateMode ? '유저 등록' : '유저 수정'}
        size="md"
        primaryAction={{ label: '저장', onClick: actions.requestSave }}
        secondaryAction={{ onClick: actions.closeEditorModal }}
        onClose={actions.closeEditorModal}
      >
        <div className="client-user-editor-form">
          <TextInput
            label="아이디"
            required
            size="md"
            value={uiProps.editor.editingRow?.userId ?? ''}
            disabled={uiProps.editor.isUserIdReadonly}
            errorText={uiProps.editor.editorErrors.userId ? '아이디를 입력해주세요.' : undefined}
            onChange={(e) => actions.changeEditingField('userId', e.target.value)}
          />
          <TextInput
            label="이름"
            required
            size="md"
            value={uiProps.editor.editingRow?.userName ?? ''}
            errorText={uiProps.editor.editorErrors.userName ? '이름을 입력해주세요.' : undefined}
            onChange={(e) => actions.changeEditingField('userName', e.target.value)}
          />
          <SelectInput
            label="권한"
            required
            size="md"
            options={CLIENT_USER_AUTHORITY_OPTIONS}
            value={uiProps.editor.editingRow?.authorityCode ?? ''}
            errorText={uiProps.editor.editorErrors.authorityCode ? '권한을 선택해주세요.' : undefined}
            onChange={(value) => actions.changeEditingField('authorityCode', value)}
          />
        </div>
      </WrapperModal>

      {/* ── 저장/수정 확인 모달 ── */}
      {uiProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={uiProps.saveConfirm.open}
          description="저장하시겠습니까?"
          primaryAction={{
            loading: uiProps.saveConfirm.isLoading,
            onClick: actions.confirmSave,
          }}
          secondaryAction={{
            disabled: uiProps.saveConfirm.isLoading,
            onClick: actions.closeSaveConfirm,
          }}
          onClose={actions.closeSaveConfirm}
        />
      ) : (
        <EditConfirmModal
          open={uiProps.saveConfirm.open}
          description="수정된 내용을 저장하시겠습니까?"
          primaryAction={{
            loading: uiProps.saveConfirm.isLoading,
            onClick: actions.confirmEdit,
          }}
          secondaryAction={{
            disabled: uiProps.saveConfirm.isLoading,
            onClick: actions.closeSaveConfirm,
          }}
          onClose={actions.closeSaveConfirm}
        />
      )}

      {/* ── 삭제 확인 모달 ── */}
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

      {/* ── 비밀번호 초기화 확인 모달 ── */}
      <SimpleDefaultModal
        open={uiProps.passwordResetTarget !== null}
        description={
          <>
            <strong className="client-user-reset-modal__account-id">
              {uiProps.passwordResetTarget?.userId}
            </strong>
            {' 비밀번호를 초기화 하시겠습니까?'}
          </>
        }
        primaryAction={{ loading: status.isResettingPassword, onClick: actions.confirmResetPassword }}
        secondaryAction={{ disabled: status.isResettingPassword, onClick: actions.closePasswordResetConfirm }}
        onClose={actions.closePasswordResetConfirm}
      />

      {/* ── 변경 내용 경고 모달 ── */}
      <SimpleDefaultModal
        open={uiProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseEditorModal }}
        secondaryAction={{ onClick: actions.closeDirtyWarning }}
        onClose={actions.closeDirtyWarning}
      />

      {/* ── 안내 모달 ── */}
      <SimpleDefaultModal
        open={!!uiProps.noticeState}
        title={uiProps.noticeState?.title ?? '알림'}
        description={uiProps.noticeState?.description}
        helperText={uiProps.noticeState?.helperText}
        onClose={actions.closeNotice}
      />
    </>
  );
}
