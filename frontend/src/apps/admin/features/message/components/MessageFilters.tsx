import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type MessageFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 메시지 관리 검색 영역.
 *
 * @description
 * - 검색 입력과 버튼만 담당하는 순수 UI 컴포넌트다.
 * - 실제 검색어 상태와 조회 실행 시점은 상위 훅에서 관리한다.
 */
export function MessageFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: MessageFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="메시지 검색"
      inputId="message-search-keyword"
      inputAriaLabel="메시지 검색어"
      placeholder="메시지 코드, 메시지 명, 내용으로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}
