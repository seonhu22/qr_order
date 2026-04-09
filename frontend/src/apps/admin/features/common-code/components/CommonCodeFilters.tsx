import '@/apps/admin/pages/PlantSearchPage.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase } from '@/shared/components/input';

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
    <article className="plant-search-page__filter-card" aria-label="공통코드 검색">
      <div className="plant-search-page__search-field">
        <InputBase
          size="md"
          value={draftKeyword}
          className="plant-search-page__search-input"
          placeholder="공통코드, 공통코드명으로 검색"
          leftSlot={<Icon id="i-search" size={14} />}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
          aria-label="공통코드 검색어"
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
