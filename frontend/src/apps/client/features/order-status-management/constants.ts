import type { SelectOption } from '@/shared/components/input';
import type { OrderBoardStatus } from './types';

/** 실시간 보드에 컬럼으로 렌더링되는 상태만 담는다. 취소는 "취소내역" 모달로 옮겨서 여기 없다. */
export const ORDER_BOARD_COLUMNS: { status: OrderBoardStatus; label: string }[] = [
  { status: 'RECEIVED', label: '접수' },
  { status: 'COOKING', label: '조리중' },
  { status: 'SERVED', label: '서빙완료' },
];

/** 보드 컬럼 여부와 무관한 상태 라벨 전체 목록 — 배지·모달 등에서 CANCELLED 라벨도 필요해 `ORDER_BOARD_COLUMNS`와 분리했다. */
export const ORDER_BOARD_STATUS_LABELS: Record<OrderBoardStatus, string> = {
  RECEIVED: '접수',
  COOKING: '조리중',
  SERVED: '서빙완료',
  CANCELLED: '취소',
};

/**
 * 칸반 컬럼 숫자 라벨(`OrderStatusColumn.css`의 `.order-status-column__count`)과 같은 색상 매핑.
 * 결제 처리 영수증·주문 수정 모달에서 주문 상태 배지(`.order-status-badge`)로 재사용한다.
 */
export const ORDER_BOARD_STATUS_BADGE_CLASS: Record<OrderBoardStatus, string> = {
  RECEIVED: 'order-status-badge--received',
  COOKING: 'order-status-badge--cooking',
  SERVED: 'order-status-badge--served',
  CANCELLED: 'order-status-badge--cancelled',
};

/** "이전" 버튼이 되돌리는 직전 상태. RECEIVED/CANCELLED는 되돌릴 곳이 없어 제외한다. */
export const ORDER_BOARD_PREV_STATUS: Partial<Record<OrderBoardStatus, OrderBoardStatus>> = {
  COOKING: 'RECEIVED',
  SERVED: 'COOKING',
};

/** "기타" 선택 시에만 "상세입력" textarea가 추가로 표시된다. */
export const ORDER_CANCEL_REASON_OTHER_VALUE = 'OTHER';

// TODO(order-cancel-common-code): cancel_type 공통코드 API가 등록되면 정적 목록을 서버 조회로 교체한다.
export const ORDER_CANCEL_REASON_OPTIONS: SelectOption[] = [
  { value: 'OUT_OF_STOCK', label: '재고품절' },
  { value: 'CUSTOMER_REQUEST', label: '고객 요청' },
  { value: 'ORDER_MISTAKE', label: '주문 오류' },
  { value: 'STORE_CLOSED', label: '영업 종료' },
  { value: ORDER_CANCEL_REASON_OTHER_VALUE, label: '기타' },
];

/** "기타" 선택 시에만 "상세입력" textarea가 추가로 표시된다. */
export const ORDER_UNPAID_REASON_OTHER_VALUE = 'OTHER';

export const ORDER_UNPAID_REASON_OPTIONS: SelectOption[] = [
  { value: 'CARD_DEVICE_ERROR', label: '카드 단말기 오류' },
  { value: 'CUSTOMER_ABSENT', label: '고객 부재' },
  { value: 'PAYMENT_DECLINED', label: '결제 거절' },
  { value: 'PAY_LATER', label: '추후 결제 예정' },
  { value: ORDER_UNPAID_REASON_OTHER_VALUE, label: '기타' },
];
