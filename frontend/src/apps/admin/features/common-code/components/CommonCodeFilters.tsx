import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type CommonCodeFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 공통코드 마스터 검색 영역
 *
 * @description
 * - 입력값 관리는 상위 훅이 담당하고, 이 컴포넌트는 검색 UI와 이벤트만 렌더링한다.
 * - Enter 키로도 조회 가능하다.
 */
export function CommonCodeFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: CommonCodeFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="공통코드 검색"
      inputId="common-code-search-keyword"
      inputAriaLabel="공통코드 검색어"
      placeholder="공통코드, 공통코드명으로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}
