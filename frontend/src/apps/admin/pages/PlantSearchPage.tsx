import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/PlantSearchPage.css';
import { PlantSearchFilters } from '@/apps/admin/features/plant-search/components/PlantSearchFilters';
import { PlantSearchTable } from '@/apps/admin/features/plant-search/components/PlantSearchTable';
import { usePlantSearchPage } from '@/apps/admin/features/plant-search/hooks/usePlantSearchPage';

/**
 * @fileoverview 사업장 조회 페이지 컨테이너
 *
 * @description
 * - 레이아웃과 feature 컴포넌트를 조립하는 역할만 맡는다.
 * - 검색 상태와 서버 조회는 usePlantSearchPage로 위임한다.
 */

export function PlantSearchPage() {
  const { data, status, actions, uiProps } = usePlantSearchPage();

  return (
    <AdminMainLayout adminMainTitle="사업장 조회" depth1="시스템" depth2="시스템 관리">
      <section className="plant-search-page" aria-label="사업장 조회 화면">
        <PlantSearchFilters
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <PlantSearchTable
          rows={data.rows}
          isLoading={status.isLoading || status.isFetching}
          isError={status.isError}
        />
      </section>
    </AdminMainLayout>
  );
}
