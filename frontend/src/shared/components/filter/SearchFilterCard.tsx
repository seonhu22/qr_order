import './SearchFilterCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper } from '@/shared/components/input';

type SearchFilterCardProps = {
  ariaLabel: string;
  inputId: string;
  inputAriaLabel: string;
  placeholder: string;
  draftKeyword: string;
  cardClassName?: string;
  searchFieldClassName?: string;
  inputClassName?: string;
  actionsClassName?: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 검색 카드 공통 컴포넌트.
 *
 * @description
 * 같은 검색 카드 구조를 사용하는 페이지는 aria/placeholder/id만 바꿔 재사용한다.
 */
export function SearchFilterCard({
  ariaLabel,
  inputId,
  inputAriaLabel,
  placeholder,
  draftKeyword,
  cardClassName = 'search-filter-card',
  searchFieldClassName = 'search-filter-card__field',
  inputClassName = 'search-filter-card__input',
  actionsClassName = 'search-filter-card__actions',
  onKeywordChange,
  onSearch,
  onReset,
}: SearchFilterCardProps) {
  return (
    <article className={cardClassName} aria-label={ariaLabel}>
      <div className={searchFieldClassName}>
        <InputWrapper inputId={inputId}>
          <InputBase
            id={inputId}
            size="md"
            value={draftKeyword}
            className={inputClassName}
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

      <div className={actionsClassName}>
        <ResetFilterButton onClick={onReset} />
        <SearchFilterButton onClick={onSearch} />
      </div>
    </article>
  );
}
