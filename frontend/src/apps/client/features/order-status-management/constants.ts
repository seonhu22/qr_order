import type { SelectOption } from '@/shared/components/input';
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABEL } from '@/shared/order-status/statusMeta';
import type { OrderBoardStatus } from './types';

export const ORDER_BOARD_COLUMNS: { status: OrderBoardStatus; label: string }[] = [
  { status: 'RECEIVED', label: ORDER_STATUS_LABEL.RECEIVED },
  { status: 'COOKING', label: ORDER_STATUS_LABEL.COOKING },
  { status: 'SERVED', label: ORDER_STATUS_LABEL.SERVED },
  { status: 'CANCELLED', label: ORDER_STATUS_LABEL.CANCELLED },
];

/**
 * 칸반 컬럼 숫자 라벨(`OrderStatusColumn.css`의 `.order-status-column__count`)과 같은 색상 매핑.
 * 결제 처리 영수증·주문 수정 모달에서 주문 상태 배지(`.order-status-badge`)로 재사용한다.
 */
export const ORDER_BOARD_STATUS_BADGE_CLASS: Record<OrderBoardStatus, string> = ORDER_STATUS_BADGE_CLASS;

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
