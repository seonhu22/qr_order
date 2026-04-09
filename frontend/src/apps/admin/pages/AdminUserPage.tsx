import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/AdminUserPage.css';
import { AdminUserFilters } from '@/apps/admin/features/admin-user/components/AdminUserFilters';
import { AdminUserTable } from '@/apps/admin/features/admin-user/components/AdminUserTable';
import { useAdminUserPage } from '@/apps/admin/features/admin-user/hooks/useAdminUserPage';
import { SaveConfirmModal, SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';

/**
 * @fileoverview 관리자 관리 페이지 컨테이너
 */

export function AdminUserPage() {
  const { data, status, actions, uiProps } = useAdminUserPage();

  return (
    <AdminMainLayout adminMainTitle="관리자 관리" depth1="시스템" depth2="시스템 관리">
      <section className="admin-user-page" aria-label="관리자 관리 화면">
        <AdminUserFilters
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <AdminUserTable
          rows={data.rows}
          selectedRowId={uiProps.selectedRowId}
          plantOptions={data.plantOptions}
          rowErrors={data.rowErrors}
          isLoading={status.isLoading || status.isFetching}
          isError={status.isError}
          isSaving={status.isSaving}
          isResettingPassword={status.isResettingPassword}
          onSelectRow={actions.handleSelectRow}
          onChangeRowField={actions.handleChangeRowField}
          onChangeRowPlant={actions.handleChangeRowPlant}
          onAddRow={actions.handleAddRow}
          onDeleteRow={actions.handleDeleteRow}
          onSave={actions.handleSave}
          onResetPassword={actions.handleResetPassword}
        />
      </section>

      <SaveConfirmModal
        open={uiProps.isSaveConfirmOpen}
        description="저장하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: status.isSaving,
          onClick: actions.confirmSave,
        }}
        secondaryAction={{
          disabled: status.isSaving,
          onClick: actions.closeSaveConfirm,
        }}
        onClose={actions.closeSaveConfirm}
      />

      <WrapperModal
        open={!!uiProps.wrapperModalState}
        title={uiProps.wrapperModalState?.title}
        subtitle={uiProps.wrapperModalState?.description}
        primaryAction={{
          label: '확인',
          onClick: actions.closeWrapperModal,
        }}
        onClose={actions.closeWrapperModal}
      />

      <SimpleDefaultModal
        open={!!uiProps.simpleModalState}
        description={uiProps.simpleModalState?.description}
        helperText={uiProps.simpleModalState?.helperText}
        primaryAction={uiProps.simpleModalState?.onConfirm ? { onClick: actions.confirmSimpleModal } : undefined}
        onClose={actions.closeSimpleModal}
      />
    </AdminMainLayout>
  );
}
