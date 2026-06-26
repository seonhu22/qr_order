import type { PaymentInfoDetailResponse } from '@/generated/types/paymentInfoDetailResponse';
import type { PaymentInfoMasterResponse } from '@/generated/types/paymentInfoMasterResponse';

/**
 * 백엔드 결제상태(`orderStatus`) enum이 아직 공개되지 않아 프론트에서 PAID/UNPAID/DINING 값을 임시로 정해
 * mock에 사용한다. orval이 생성한 MSW 핸들러는 faker로 무작위 문자열을 반환해 배지/디테일 폼이
 * 의미 있게 보이지 않으므로, 이 데이터를 `src/mocks/handlers.ts`의 오버라이드 핸들러에서 사용한다.
 *
 * `PaymentInfoDetailResponse`에는 마스터를 가리키는 별도 필드(linkSysId 등)가 없어,
 * 각 디테일 항목의 `sysId`를 대응하는 마스터 행의 `sysId`와 동일하게 맞춰 매칭한다고 가정한다.
 *
 * `items`는 "주문 메뉴 X 수량 ( 옵션 ) 금액" 형식의 줄을 줄바꿈으로 이어붙인 문자열이다.
 * 화면에서는 별도 가공 없이 줄바꿈 그대로 표시해 항목별 한 줄 리스트로 보이게 한다.
 * `cancelReason`/`cancelDescription`은 결제완료(PAID) 건에만 의미가 있다 — 미결제/식사중 건은
 * 화면에서 항상 "-"로 표시하므로(`PaymentStatusDetailForm` 참고) 값이 있어도 노출되지 않는다.
 * `paymentType`(결제 수단)도 결제완료 건에만 의미가 있어 미결제·식사중 건은 `'-'`로 둔다
 * (화면에서도 `PaymentStatusMasterTable`의 `formatPaymentType`로 동일하게 강제한다).
 */
export const PAYMENT_STATUS_MASTER_MOCK: PaymentInfoMasterResponse[] = [
  {
    sysId: 'payment-001',
    tableInfo: '1',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1001,
    orderDatetime: '2026-06-22T12:05:00',
    totalPrice: 23000,
  },
  {
    sysId: 'payment-002',
    tableInfo: '3',
    paymentType: '-',
    orderStatus: 'DINING',
    orderNum: 1002,
    orderDatetime: '2026-06-21T19:32:00',
    totalPrice: 18500,
  },
  {
    sysId: 'payment-003',
    tableInfo: '5',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1003,
    orderDatetime: '2026-06-21T19:10:00',
    totalPrice: 12000,
  },
  {
    sysId: 'payment-004',
    tableInfo: '2',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1004,
    orderDatetime: '2026-06-18T13:45:00',
    totalPrice: 31000,
  },
  {
    sysId: 'payment-005',
    tableInfo: '4',
    paymentType: '-',
    orderStatus: 'DINING',
    orderNum: 1005,
    orderDatetime: '2026-06-15T18:20:00',
    totalPrice: 27000,
  },
  {
    sysId: 'payment-006',
    tableInfo: '6',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1006,
    orderDatetime: '2026-05-30T11:50:00',
    totalPrice: 9500,
  },
];

export const PAYMENT_STATUS_DETAIL_MOCK: PaymentInfoDetailResponse[] = [
  {
    sysId: 'payment-001',
    orderNum: 1001,
    items: '쌀국수 X 1 ( 곱배기 x1 , 고기추가 x1 , 국물많이 ) 14,900원\n반미 X 1 ( 고수 x1 ) 6,900원',
    orderStatus: 'PAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-002',
    orderNum: 1002,
    items: '파스타 X 1 6,900원\n샐러드 X 1 5,500원\n콜라 X 2 4,000원',
    orderStatus: 'DINING',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-003',
    orderNum: 1003,
    items: '라떼 X 1 4,900원',
    orderStatus: 'UNPAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-004',
    orderNum: 1004,
    items: '스테이크 X 1 ( 미디엄 웰던 ) 26,000원\n와인 X 1 9,000원',
    orderStatus: 'PAID',
    cancelReason: '고객 요청',
    cancelDescription: '주문 후 메뉴 변경 요청으로 결제 취소 후 재주문 처리됨.',
  },
  {
    sysId: 'payment-005',
    orderNum: 1005,
    items: '피자 X 1 ( 치즈크러스트 ) 18,900원\n맥주 X 2 8,200원',
    orderStatus: 'DINING',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-006',
    orderNum: 1006,
    items: '아이스티 X 1 4,900원',
    orderStatus: 'UNPAID',
    cancelReason: '',
    cancelDescription: '',
  },
];
