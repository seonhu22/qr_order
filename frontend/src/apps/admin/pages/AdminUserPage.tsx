import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/AdminUserPage.css';
import { AdminUserFilters } from '@/apps/admin/features/admin-user/components/AdminUserFilters';
import { AdminUserTable } from '@/apps/admin/features/admin-user/components/AdminUserTable';
import { useAdminUserPage } from '@/apps/admin/features/admin-user/hooks/useAdminUserPage';

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
          isLoading={status.isLoading || status.isFetching}
          isError={status.isError}
          onAddRow={actions.handleAddRow}
          onDeleteRow={actions.handleDeleteRow}
          onSave={actions.handleSave}
          onResetPassword={actions.handleResetPassword}
        />
      </section>
    </AdminMainLayout>
  );
}
