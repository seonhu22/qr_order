import { Icon } from '@/shared/assets/icons/Icon';
import { ResetFilterButton, SearchFilterButton } from '@/shared/components/button';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import type { OrderHistoryDatePresetKey, OrderHistoryStatusFilterKey } from '../types';

const DATE_PRESET_OPTIONS = [
  { value: 'direct', label: '직접 선택' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'year', label: '최근 1년' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: '주문 상태 전체' },
  { value: 'RECEIVED', label: '접수중' },
  { value: 'COOKING', label: '조리중' },
  { value: 'SERVED', label: '서빙완료' },
  { value: 'CANCELLED', label: '취소' },
];

type OrderHistoryFiltersProps = {
  draftKeyword: string;
  draftOrderStatus: OrderHistoryStatusFilterKey;
  draftPreset: OrderHistoryDatePresetKey;
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  onKeywordChange: (value: string) => void;
  onOrderStatusChange: (value: OrderHistoryStatusFilterKey) => void;
  onPresetChange: (preset: OrderHistoryDatePresetKey) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function OrderHistoryFilters({
  draftKeyword,
  draftOrderStatus,
  draftPreset,
  draftStartDate,
  draftEndDate,
  dateRangeError,
  onKeywordChange,
  onOrderStatusChange,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onReset,
}: OrderHistoryFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <article className="order-history-filters" aria-label="주문 이력 검색">
      {/* 주문상태 필터(좌) + 키워드 검색(우) */}
      <div className="order-history-filters__keyword-row">
        <SelectInput
          size="md"
          value={draftOrderStatus}
          options={ORDER_STATUS_OPTIONS}
          onChange={(value) => onOrderStatusChange(value as OrderHistoryStatusFilterKey)}
          className="order-history-filters__status-filter"
        />

        <InputWrapper inputId="order-history-keyword" className="order-history-filters__keyword">
          <InputBase
            id="order-history-keyword"
            size="md"
            value={draftKeyword}
            placeholder="주문번호, 테이블 번호로 검색"
            leftSlot={<Icon id="i-search" size={14} />}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="주문 이력 검색어"
          />
        </InputWrapper>
      </div>

      {/* 기간 프리셋 + 날짜 범위 + 버튼 */}
      <div className="order-history-filters__date-row">
        <SelectInput
          size="md"
          value={draftPreset}
          options={DATE_PRESET_OPTIONS}
          onChange={(value) => onPresetChange(value as OrderHistoryDatePresetKey)}
          className="order-history-filters__preset"
        />

        <div className="order-history-filters__date-range">
          <InputWrapper inputId="order-history-start-date">
            <InputBase
              id="order-history-start-date"
              type="datetime-local"
              size="md"
              value={draftStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="시작 일시"
            />
          </InputWrapper>
          <span className="order-history-filters__date-sep">~</span>
          <InputWrapper inputId="order-history-end-date">
            <InputBase
              id="order-history-end-date"
              type="datetime-local"
              size="md"
              value={draftEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="종료 일시"
            />
          </InputWrapper>
        </div>

        <div className="order-history-filters__actions">
          <ResetFilterButton onClick={onReset} />
          <SearchFilterButton onClick={onSearch} />
        </div>
      </div>

      {/* 에러 또는 안내 문구 */}
      {dateRangeError ? (
        <p className="order-history-filters__error">{dateRangeError}</p>
      ) : (
        <p className="order-history-filters__hint">
          조회 기간은 최대 1년(365일)까지 설정할 수 있습니다.
        </p>
      )}
    </article>
  );
}
