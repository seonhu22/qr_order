import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import './PlantStatusPage.css';
import { PlantStatusFilters } from '@/apps/admin/features/plant-status/components/PlantStatusFilters';
import { PlantStatusTable } from '@/apps/admin/features/plant-status/components/PlantStatusTable';
import { usePlantStatusPage } from '@/apps/admin/features/plant-status/hooks/usePlantStatusPage';

export function PlantStatusPage() {
  const { data, status, actions, uiProps } = usePlantStatusPage();

  return (
    <AdminMainLayout
      adminMainTitle="사업장 상태 조회"
      depth1="결제"
      depth2="결제 관리"
      className="admin-main-layout-page--fixed"
      filterSlot={
        <PlantStatusFilters
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />
      }
    >
      <PlantStatusTable
        rows={data.rows}
        isLoading={status.isLoading || status.isFetching}
        isError={status.isError}
      />
    </AdminMainLayout>
  );
}