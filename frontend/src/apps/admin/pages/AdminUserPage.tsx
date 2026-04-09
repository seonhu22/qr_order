/**
 * @fileoverview 관리자 관리 페이지 컨테이너
 *
 * @description
 * 이 페이지는 화면 조립 역할만 담당한다.
 * 실제 상태 계산과 UX 플로우는 feature hook으로 이동시켜
 * 페이지가 필터/테이블/모달을 조립하는 수준에서 머물도록 유지한다.
 */

import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/AdminUserPage.css';
import { AdminUserFilters } from '@/apps/admin/features/admin-user/components/AdminUserFilters';
import { AdminUserFlowModals } from '@/apps/admin/features/admin-user/components/AdminUserFlowModals';
import { AdminUserTable } from '@/apps/admin/features/admin-user/components/AdminUserTable';
import { useAdminUserPage } from '@/apps/admin/features/admin-user/hooks/useAdminUserPage';

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

      <AdminUserFlowModals
        state={uiProps.flowState}
        isSaving={status.isSaving}
        onConfirmSave={actions.confirmSave}
        onCloseSaveConfirm={actions.closeSaveConfirm}
        onCloseSimpleModal={actions.closeSimpleModal}
        onCloseWrapperModal={actions.closeWrapperModal}
        onConfirmSimpleModal={actions.confirmSimpleModal}
      />
    </AdminMainLayout>
  );
}
