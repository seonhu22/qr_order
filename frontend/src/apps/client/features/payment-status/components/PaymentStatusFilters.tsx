import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import type { DateRangePresetKey } from '@/shared/hooks/useDateRangePresetDraft';
import type { PaymentStatusFilterKey } from '../types';

const DATE_PRESET_OPTIONS = [
  { value: 'direct', label: '직접 선택' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'year', label: '최근 1년' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: '결제 상태 전체' },
  { value: 'PAID', label: '결제완료' },
  { value: 'UNPAID', label: '미결제' },
];

type PaymentStatusFiltersProps = {
  draftKeyword: string;
  draftPaymentStatus: PaymentStatusFilterKey;
  draftPreset: DateRangePresetKey;
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  onKeywordChange: (value: string) => void;
  onPaymentStatusChange: (value: PaymentStatusFilterKey) => void;
  onPresetChange: (preset: DateRangePresetKey) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function PaymentStatusFilters({
  draftKeyword,
  draftPaymentStatus,
  draftPreset,
  draftStartDate,
  draftEndDate,
  dateRangeError,
  onKeywordChange,
  onPaymentStatusChange,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onReset,
}: PaymentStatusFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="payment-status-filters" aria-label="결제 목록 검색">
      {/* 결제상태 필터(좌) + 키워드 검색(우) */}
      <div className="payment-status-filters__keyword-row">
        <SelectInput
          size="md"
          value={draftPaymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          onChange={(value) => onPaymentStatusChange(value as PaymentStatusFilterKey)}
          className="payment-status-filters__status-filter"
        />

        <InputWrapper inputId="payment-status-keyword" className="payment-status-filters__keyword">
          <InputBase
            id="payment-status-keyword"
            size="md"
            value={draftKeyword}
            placeholder="결제번호로 검색"
            leftSlot={<Icon id="i-search" size={14} />}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="결제 목록 검색어"
          />
        </InputWrapper>
      </div>

      {/* 기간 프리셋 + 날짜 범위 + 버튼 */}
      <div className="payment-status-filters__date-row">
        <SelectInput
          size="md"
          value={draftPreset}
          options={DATE_PRESET_OPTIONS}
          onChange={(value) => onPresetChange(value as DateRangePresetKey)}
          className="payment-status-filters__preset"
        />

        <div className="payment-status-filters__date-range">
          <InputWrapper inputId="payment-status-start-date">
            <InputBase
              id="payment-status-start-date"
              type="datetime-local"
              size="md"
              value={draftStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="시작 일시"
            />
          </InputWrapper>
          <span className="payment-status-filters__date-sep">~</span>
          <InputWrapper inputId="payment-status-end-date">
            <InputBase
              id="payment-status-end-date"
              type="datetime-local"
              size="md"
              value={draftEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="종료 일시"
            />
          </InputWrapper>
        </div>

        <div className="payment-status-filters__actions">
          <ResetFilterButton onClick={onReset} />
          <SearchFilterButton onClick={onSearch} />
        </div>
      </div>

      {/* 에러 또는 안내 문구 */}
      {dateRangeError ? (
        <p className="payment-status-filters__error">{dateRangeError}</p>
      ) : (
        <p className="payment-status-filters__hint">
          조회 기간은 최대 1년(365일)까지 설정할 수 있습니다.
        </p>
      )}
    </article>
  );
}
