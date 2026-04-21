import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import './PlantStatusPage.css';
import { PlantStatusTable } from '@/apps/admin/features/plant-status/components/PlantStatusTable';
import { usePlantStatusPage } from '@/apps/admin/features/plant-status/hooks/usePlantStatusPage';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

export function PlantStatusPage() {
  const { data, status, actions, uiProps } = usePlantStatusPage();

  return (
    <AdminMainLayout
      adminMainTitle="사업장 상태 조회"
      depth1="시스템"
      depth2="결제 관리"
      className="admin-main-layout-page--fixed"
      filterSlot={
        <SearchFilterCard
          ariaLabel="사업장 상태 검색"
          inputId="plant-status-search-keyword"
          inputAriaLabel="사업장 상태 검색어"
          placeholder="사업자 번호, 결제 요금 코드, 결제 요금명으로 검색"
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
