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
 *
 * @description
 * - 검색 입력과 버튼 UI만 담당한다.
 * - dirty 판단, 조회 전 확인 모달, 필터 초기화 후처리 등은 상위 flow 훅에서 처리한다.
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
