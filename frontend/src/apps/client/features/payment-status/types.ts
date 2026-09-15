export type PaymentStatusCode = 'PAID' | 'UNPAID';

export type PaymentStatusMasterRow = {
  id: string;
  orderNo: string;
  paymentType: string;
  totalPrice: number;
  paymentStatus: PaymentStatusCode;
};

export type PaymentStatusDetail = {
  orderNo: string;
  paymentStatus: PaymentStatusCode;
  /** 결제 수단. 상세 조회 API에는 없는 필드라 마스터 목록에서 선택된 행의 값을 그대로 사용한다. */
  paymentType: string;
  cancelReason: string;
  items: string;
  cancelDescription: string;
};

export type PaymentOrderOption = {
  optionName: string;
  qty: number;
  price: number;
  totalPrice: number;
};

export type PaymentOrderItem = {
  /** 이 메뉴가 속한 주문의 주문번호. 하나의 결제(결제번호)가 여러 주문을 묶어 처리할 수 있어 항목마다 다를 수 있다. */
  orderNo?: string;
  menuName: string;
  qty: number;
  price: number;
  totalPrice: number;
  paymentYn: string;
  /** paymentYn이 취소(N)인 항목의 취소 사유. 결제(Y) 항목에는 없다. */
  cancelReason?: string;
  options: PaymentOrderOption[];
};

export type ParsedPaymentOrderItems =
  | {
      kind: 'structured';
      items: PaymentOrderItem[];
    }
  | {
      kind: 'text';
      lines: string[];
    };

export type PaymentStatusSearchParams = {
  /** "YYYY-MM-DD HH:mm:ss" */
  startDate: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  endDate: string;
  /** ''이면 전체 — 백엔드 GetPaymentInfoMasterParams.paymentStatus는 필수 파라미터라 빈 문자열로 보낸다 */
  paymentStatus: PaymentStatusCode | '';
};

/** 결제상태 필터 콤보 값. `ALL`은 전체(필터 미적용)를 의미한다. */
export type PaymentStatusFilterKey = 'ALL' | PaymentStatusCode;
