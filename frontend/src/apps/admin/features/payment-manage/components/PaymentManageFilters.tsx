import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';

type PaymentManageFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function PaymentManageFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: PaymentManageFiltersProps) {
  return (
    <SearchFilterCard
      ariaLabel="결제 요금 검색"
      inputId="payment-manage-search-keyword"
      inputAriaLabel="결제 요금 검색어"
      placeholder="결제 요금 코드, 결제 요금 명으로 검색"
      draftKeyword={draftKeyword}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onReset={onReset}
    />
  );
}
