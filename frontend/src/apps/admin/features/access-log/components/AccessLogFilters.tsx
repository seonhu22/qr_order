import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper } from '@/shared/components/input';

type AccessLogFiltersProps = {
  draftKeyword: string;
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  onKeywordChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function AccessLogFilters({
  draftKeyword,
  draftStartDate,
  draftEndDate,
  dateRangeError,
  onKeywordChange,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onReset,
}: AccessLogFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="access-log-filters" aria-label="접속정보 검색">
      {/* 키워드 검색 */}
      <div className="access-log-filters__keyword-row">
        <InputWrapper inputId="access-log-keyword">
          <InputBase
            id="access-log-keyword"
            size="md"
            value={draftKeyword}
            placeholder="사용자 아이디, 사용자명, IP 주소로 검색"
            leftSlot={<Icon id="i-search" size={14} />}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="접속정보 검색어"
          />
        </InputWrapper>
      </div>

      {/* 날짜 범위 + 버튼 */}
      <div className="access-log-filters__date-row">
        <div className="access-log-filters__date-range">
          <InputWrapper inputId="access-log-start-date">
            <InputBase
              id="access-log-start-date"
              type="datetime-local"
              size="md"
              value={draftStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="시작 일시"
            />
          </InputWrapper>
          <span className="access-log-filters__date-sep">~</span>
          <InputWrapper inputId="access-log-end-date">
            <InputBase
              id="access-log-end-date"
              type="datetime-local"
              size="md"
              value={draftEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="종료 일시"
            />
          </InputWrapper>
        </div>

        <div className="access-log-filters__actions">
          <ResetFilterButton onClick={onReset} />
          <SearchFilterButton onClick={onSearch} />
        </div>
      </div>

      {/* 에러 또는 안내 문구 */}
      {dateRangeError ? (
        <p className="access-log-filters__error">{dateRangeError}</p>
      ) : (
        <p className="access-log-filters__hint">조회 기간은 최대 7일까지 설정할 수 있습니다.</p>
      )}
    </article>
  );
}
