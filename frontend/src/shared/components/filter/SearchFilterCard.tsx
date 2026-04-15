import '@/apps/admin/pages/PlantSearchPage.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper } from '@/shared/components/input';

type SearchFilterCardProps = {
  ariaLabel: string;
  inputId: string;
  inputAriaLabel: string;
  placeholder: string;
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 관리자 검색 카드 공통 컴포넌트.
 *
 * @description
 * MessageFilters의 레이아웃을 기준으로 만든 공용 filter card다.
 * 같은 검색 카드 구조를 사용하는 페이지는 aria/placeholder/id만 바꿔 재사용한다.
 */
export function SearchFilterCard({
  ariaLabel,
  inputId,
  inputAriaLabel,
  placeholder,
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: SearchFilterCardProps) {
  return (
    <article className="plant-search-page__filter-card" aria-label={ariaLabel}>
      <div className="plant-search-page__search-field">
        <InputWrapper inputId={inputId}>
          <InputBase
            id={inputId}
            size="md"
            value={draftKeyword}
            className="plant-search-page__search-input"
            placeholder={placeholder}
            leftSlot={<Icon id="i-search" size={14} />}
            onChange={(event) => onKeywordChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearch();
              }
            }}
            aria-label={inputAriaLabel}
          />
        </InputWrapper>
      </div>

      <div className="plant-search-page__filter-actions">
        <ResetFilterButton onClick={onReset} />
        <SearchFilterButton onClick={onSearch} />
      </div>
    </article>
  );
}
