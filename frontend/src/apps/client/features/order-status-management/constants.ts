import type { SelectOption } from '@/shared/components/input';
import type { OrderBoardStatus } from './types';

export const ORDER_BOARD_COLUMNS: { status: OrderBoardStatus; label: string }[] = [
  { status: 'RECEIVED', label: '접수' },
  { status: 'COOKING', label: '조리중' },
  { status: 'SERVED', label: '서빙완료' },
  { status: 'CANCELLED', label: '취소' },
];

/** "이전" 버튼이 되돌리는 직전 상태. RECEIVED/CANCELLED는 되돌릴 곳이 없어 제외한다. */
export const ORDER_BOARD_PREV_STATUS: Partial<Record<OrderBoardStatus, OrderBoardStatus>> = {
  COOKING: 'RECEIVED',
  SERVED: 'COOKING',
};

/** "기타" 선택 시에만 "상세입력" textarea가 추가로 표시된다. */
export const ORDER_CANCEL_REASON_OTHER_VALUE = 'OTHER';

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
