import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';

const AUDIT_FLAG_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'I', label: '등록' },
  { value: 'U', label: '수정' },
  { value: 'D', label: '삭제' },
];

type ChangeHistoryFiltersProps = {
  draftAuditFlag: string;
  draftKeyword: string;
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  onAuditFlagChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function ChangeHistoryFilters({
  draftAuditFlag,
  draftKeyword,
  draftStartDate,
  draftEndDate,
  dateRangeError,
  onAuditFlagChange,
  onKeywordChange,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onReset,
}: ChangeHistoryFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="change-history-filters" aria-label="변경 이력 검색">
      {/* 1줄: 변경구분 셀렉트 + 키워드 검색 */}
      <div className="change-history-filters__top-row">
        <div className="change-history-filters__select">
          <InputWrapper inputId="change-history-audit-flag">
            <SelectInput
              size="md"
              value={draftAuditFlag}
              options={AUDIT_FLAG_OPTIONS}
              onChange={onAuditFlagChange}
            />
          </InputWrapper>
        </div>
        <div className="change-history-filters__keyword">
          <InputWrapper inputId="change-history-keyword">
            <InputBase
              id="change-history-keyword"
              size="md"
              value={draftKeyword}
              placeholder="메뉴명, 수정내용으로 검색"
              leftSlot={<Icon id="i-search" size={14} />}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="변경 이력 검색어"
            />
          </InputWrapper>
        </div>
      </div>

      {/* 2줄: 날짜 범위 + 버튼 */}
      <div className="change-history-filters__date-row">
        <div className="change-history-filters__date-range">
          <InputWrapper inputId="change-history-start-date">
            <InputBase
              id="change-history-start-date"
              type="date"
              size="md"
              value={draftStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="시작일"
            />
          </InputWrapper>
          <span className="change-history-filters__date-sep">~</span>
          <InputWrapper inputId="change-history-end-date">
            <InputBase
              id="change-history-end-date"
              type="date"
              size="md"
              value={draftEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="종료일"
            />
          </InputWrapper>
        </div>

        <div className="change-history-filters__actions">
          <ResetFilterButton onClick={onReset} />
          <SearchFilterButton onClick={onSearch} />
        </div>
      </div>

      {dateRangeError && (
        <p className="change-history-filters__error">{dateRangeError}</p>
      )}
    </article>
  );
}
