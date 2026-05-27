import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import './ChangeHistoryPage.css';
import { ChangeHistoryFilters } from '@/apps/admin/features/change-history/components/ChangeHistoryFilters';
import { ChangeHistoryTable } from '@/apps/admin/features/change-history/components/ChangeHistoryTable';
import { useChangeHistoryPageState } from '@/apps/admin/features/change-history/hooks/useChangeHistoryPageState';

export function ChangeHistoryPage() {
  const { data, status, actions, uiProps } = useChangeHistoryPageState();

  return (
    <AdminMainLayout
      adminMainTitle="변경 이력 조회"
      depth1="시스템"
      depth2="이력 관리"
      className="admin-main-layout-page--fixed"
      filterSlot={
        <ChangeHistoryFilters
          draftAuditFlag={uiProps.draftAuditFlag}
          draftKeyword={uiProps.draftKeyword}
          draftStartDate={uiProps.draftStartDate}
          draftEndDate={uiProps.draftEndDate}
          dateRangeError={uiProps.dateRangeError}
          onAuditFlagChange={actions.handleAuditFlagChange}
          onKeywordChange={actions.handleKeywordChange}
          onStartDateChange={actions.handleStartDateChange}
          onEndDateChange={actions.handleEndDateChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />
      }
    >
      <ChangeHistoryTable
        rows={data.rows}
        isLoading={status.isLoading}
        isError={status.isError}
      />
    </AdminMainLayout>
  );
}
