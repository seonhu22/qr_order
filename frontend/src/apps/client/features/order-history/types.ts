export type OrderHistoryStatus = 'RECEIVED' | 'COOKING' | 'SERVED' | 'CANCELLED';
export type OrderHistoryPaymentStatus = 'PENDING' | 'PAID' | 'UNPAID' | 'REFUNDED';

export type OrderHistoryRow = {
  id: string;
  orderNo: string;
  tableNum: string;
  orderStatus: OrderHistoryStatus;
  paymentStatus: OrderHistoryPaymentStatus;
  /** ISO 형식("YYYY-MM-DDTHH:mm:ss") 원본 일시. 표시는 컴포넌트에서 "YYYY-MM-DD HH:MM"으로 가공한다. */
  orderDatetime: string;
};

export type OrderHistorySearchParams = {
  /** "YYYY-MM-DD HH:mm:ss" */
  startDate: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  endDate: string;
  searchKeyword: string;
  /** ''이면 전체 */
  orderStatus: OrderHistoryStatus | '';
};

/**
 * 날짜 범위 프리셋 콤보 값. `useDateRangePresetDraft`(공용 훅)의 타입을 그대로 재사용한다.
 * `SelectInput`은 value가 빈 문자열인 옵션을 무효 처리해 제외하므로
 * "직접 선택"도 비어 있지 않은 sentinel 값(`direct`)을 사용한다.
 */
export type { DateRangePresetKey as OrderHistoryDatePresetKey } from '@/shared/hooks/useDateRangePresetDraft';

/** 주문 상태 필터 콤보 값. `ALL`은 전체(필터 미적용)를 의미한다. */
export type OrderHistoryStatusFilterKey = 'ALL' | OrderHistoryStatus;
