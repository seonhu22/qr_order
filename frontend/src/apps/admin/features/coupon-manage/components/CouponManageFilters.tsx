import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type CouponManageFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function CouponManageFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: CouponManageFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="쿠폰 검색"
      inputId="coupon-manage-search-keyword"
      inputAriaLabel="쿠폰 검색어"
      placeholder="쿠폰 코드, 쿠폰 명으로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}