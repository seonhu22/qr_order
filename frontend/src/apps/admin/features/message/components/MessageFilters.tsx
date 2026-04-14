import '@/apps/admin/pages/PlantSearchPage.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase, InputWrapper } from '@/shared/components/input';

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
    <article className="plant-search-page__filter-card" aria-label="메시지 검색">
      <div className="plant-search-page__search-field">
        <InputWrapper inputId="message-search-keyword">
          <InputBase
            id="message-search-keyword"
            size="md"
            value={draftKeyword}
            className="plant-search-page__search-input"
            placeholder="메시지 코드, 메시지 명, 내용으로 검색"
            leftSlot={<Icon id="i-search" size={14} />}
            onChange={(event) => onKeywordChange(event.target.value)}
            onKeyDown={(event) => {
              /* Enter 키로도 조회할 수 있게 처리 */
              if (event.key === 'Enter') onSearch();
            }}
            aria-label="메시지 검색어"
          />
        </InputWrapper>
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
