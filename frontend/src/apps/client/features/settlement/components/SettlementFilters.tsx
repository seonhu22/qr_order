import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import type { DateRangePresetKey } from '@/shared/hooks/useDateRangePresetDraft';

const DATE_PRESET_OPTIONS = [
  { value: 'direct', label: '직접 선택' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'year', label: '최근 1년' },
];

type SettlementFiltersProps = {
  draftPreset: DateRangePresetKey;
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  onPresetChange: (preset: DateRangePresetKey) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function SettlementFilters({
  draftPreset,
  draftStartDate,
  draftEndDate,
  dateRangeError,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onReset,
}: SettlementFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="settlement-filters" aria-label="정산 조회 검색">
      <div className="settlement-filters__row">
        <SelectInput
          size="md"
          value={draftPreset}
          options={DATE_PRESET_OPTIONS}
          onChange={(value) => onPresetChange(value as DateRangePresetKey)}
          className="settlement-filters__preset"
        />

        <div className="settlement-filters__date-range">
          <InputWrapper inputId="settlement-start-date">
            <InputBase
              id="settlement-start-date"
              type="datetime-local"
              size="md"
              value={draftStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="시작 일시"
            />
          </InputWrapper>
          <span className="settlement-filters__date-sep">~</span>
          <InputWrapper inputId="settlement-end-date">
            <InputBase
              id="settlement-end-date"
              type="datetime-local"
              size="md"
              value={draftEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="종료 일시"
            />
          </InputWrapper>
        </div>

        <div className="settlement-filters__actions">
          <ResetFilterButton onClick={onReset} />
          <SearchFilterButton onClick={onSearch} />
        </div>
      </div>

      {dateRangeError ? (
        <p className="settlement-filters__error">{dateRangeError}</p>
      ) : (
        <p className="settlement-filters__hint">조회 기간은 최대 1년(365일)까지 설정할 수 있습니다.</p>
      )}
    </article>
  );
}
