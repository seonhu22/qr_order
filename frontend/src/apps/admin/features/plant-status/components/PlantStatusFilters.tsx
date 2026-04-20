import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type PlantStatusFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function PlantStatusFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: PlantStatusFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="사업장 상태 검색"
      inputId="plant-status-keyword"
      inputAriaLabel="사업장 상태 검색어"
      placeholder="사업자 번호, 결제 요금 코드로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}