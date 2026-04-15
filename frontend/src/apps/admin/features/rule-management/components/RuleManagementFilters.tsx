import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type RuleManagementFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 규칙 관리 검색 영역.
 *
 * @description
 * 공통코드와 같은 필터 레이아웃을 재사용하되,
 * 규칙 화면에 맞는 placeholder/접근성 라벨만 설정한다.
 */
export function RuleManagementFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: RuleManagementFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="규칙 검색"
      inputId="rule-search-keyword"
      inputAriaLabel="규칙 검색어"
      placeholder="규칙코드, 규칙명으로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}
