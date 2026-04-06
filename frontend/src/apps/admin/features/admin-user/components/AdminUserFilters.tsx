import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase } from '@/shared/components/input';

type AdminUserFiltersProps = {
  draftKeyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

/**
 * 관리자 관리 검색 영역
 */
export function AdminUserFilters({
  draftKeyword,
  onKeywordChange,
  onSearch,
  onReset,
}: AdminUserFiltersProps) {
  return (
    <article className="admin-user-page__filter-card" aria-label="관리자 검색">
      <div className="admin-user-page__search-field">
        <InputBase
          size="md"
          value={draftKeyword}
          className="admin-user-page__search-input"
          placeholder="사용자 아이디, 사용자 명으로 검색"
          leftSlot={<Icon id="i-search" size={14} />}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          aria-label="관리자 검색어"
        />
      </div>

      <div className="admin-user-page__filter-actions">
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
