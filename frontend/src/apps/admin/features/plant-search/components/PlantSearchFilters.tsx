import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase } from '@/shared/components/input';

type PlantSearchFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 사업장 조회 검색 영역
 *
 * @description
 * - 입력값 관리 자체는 상위 hook이 담당하고,
 *   이 컴포넌트는 검색 UI와 사용자 이벤트만 렌더링한다.
 */
export function PlantSearchFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: PlantSearchFiltersProps) {
  return (
    <article className="plant-search-page__filter-card" aria-label="사업장 검색">
      <div className="plant-search-page__search-field">
        <InputBase
          size="md"
          value={draftKeyword}
          className="plant-search-page__search-input"
          placeholder="사업장명, 매장명으로 검색"
          leftSlot={<Icon id="i-search" size={14} />}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          aria-label="사업장 검색어"
        />
      </div>

      <div className="plant-search-page__filter-actions">
        <Button type="button" variant="outline" size="md" onClick={onReset}>
          초기화
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Icon id="i-search" size={15} />}
          onClick={onSearch}
        >
          조회
        </Button>
      </div>
    </article>
  );
}
