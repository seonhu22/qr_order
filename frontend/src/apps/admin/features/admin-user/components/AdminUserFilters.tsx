import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type AdminUserFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 관리자 관리 검색 영역
 *
 * @description
 * - 검색 입력과 버튼 UI만 담당한다.
 * - dirty 판단, 조회 전 확인 모달, 필터 초기화 후처리 등은 상위 flow 훅에서 처리한다.
 */
export function AdminUserFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: AdminUserFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="관리자 검색"
      inputId="admin-user-search-keyword"
      inputAriaLabel="관리자 검색어"
      placeholder="사용자 아이디, 사용자 명으로 검색"
      draftKeyword={draftKeyword}
      cardClassName="admin-user-page__filter-card"
      searchFieldClassName="admin-user-page__search-field"
      inputClassName="admin-user-page__search-input"
      actionsClassName="admin-user-page__filter-actions"
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}
