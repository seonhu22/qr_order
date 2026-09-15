import type { PaymentInfoDetailResponse } from '@/generated/types/paymentInfoDetailResponse';
import type { PaymentInfoMasterResponse } from '@/generated/types/paymentInfoMasterResponse';

/**
 * 백엔드 결제상태(`orderStatus`) enum이 아직 공개되지 않아 프론트에서 PAID/UNPAID 값을 임시로 정해
 * mock에 사용한다(식사중·취소 등은 다루지 않기로 결정 — 결제완료/미결제 2가지만 구분).
 * orval이 생성한 MSW 핸들러는 faker로 무작위 문자열을 반환해 배지/디테일 폼이
 * 의미 있게 보이지 않으므로, 이 데이터를 `src/mocks/handlers.ts`의 오버라이드 핸들러에서 사용한다.
 *
 * `PaymentInfoDetailResponse`에는 마스터를 가리키는 별도 필드(linkSysId 등)가 없어,
 * 각 디테일 항목의 `sysId`를 대응하는 마스터 행의 `sysId`와 동일하게 맞춰 매칭한다고 가정한다.
 *
 * `items`는 백엔드에서 문자열로 내려온다. 운영 응답은 JSON 배열 문자열일 수 있고, 기존 mock처럼
 * "주문 메뉴 X 수량 ( 옵션 ) 금액" 형식의 줄바꿈 문자열일 수도 있다.
 * 화면은 JSON 배열 문자열이면 카드 리스트로, 일반 문자열이면 줄 단위 fallback 리스트로 표시한다.
 * `cancelReason`/`cancelDescription`은 미결제(UNPAID) 건에만 "미결제 사유"로 표시되고
 * (`PaymentStatusDetailForm` 참고), 결제완료(PAID) 건은 필드 자체가 화면에 표시되지 않는다.
 * `paymentType`(결제 수단)도 결제완료 건에만 의미가 있어 미결제 건은 `'-'`로 둔다
 * (화면에서도 `PaymentStatusMasterTable`의 `formatPaymentType`로 동일하게 강제한다).
 *
 * 날짜는 조회 시점(now) 기준 상대값으로 생성한다. 절대 날짜로 고정하면 화면 기본 조회 범위(최근 7일)
 * 밖으로 밀려나 시간이 지나면 mock이 안 보이게 된다(order-history mock에서 확인된 동일 증상).
 */
function orderDatetimeDaysAgo(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:00`;
}

export const PAYMENT_STATUS_MASTER_MOCK: PaymentInfoMasterResponse[] = [
  {
    sysId: 'payment-001',
    tableInfo: '1',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1001,
    // daysAgo 0(오늘)은 실행 시각과 무관하게 항상 "과거"가 되도록 자정(00:00)으로 고정한다.
    orderDatetime: orderDatetimeDaysAgo(0, 0, 0),
    // totalPrice는 items(옵션 포함) 합계와 일치해야 한다 — 상세 화면의 "전체 결제 금액"과 대조되므로.
    totalPrice: 24800,
  },
  {
    sysId: 'payment-002',
    tableInfo: '3',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1002,
    orderDatetime: orderDatetimeDaysAgo(1, 19, 32),
    totalPrice: 16400,
  },
  {
    sysId: 'payment-003',
    tableInfo: '5',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1003,
    orderDatetime: orderDatetimeDaysAgo(1, 19, 10),
    totalPrice: 4900,
  },
  {
    sysId: 'payment-004',
    tableInfo: '2',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1004,
    orderDatetime: orderDatetimeDaysAgo(4, 13, 45),
    totalPrice: 35000,
  },
  {
    sysId: 'payment-005',
    tableInfo: '4',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1005,
    orderDatetime: orderDatetimeDaysAgo(6, 18, 20),
    totalPrice: 27100,
  },
  {
    sysId: 'payment-006',
    tableInfo: '6',
    paymentType: '-',
    orderStatus: 'UNPAID',
    orderNum: 1006,
    orderDatetime: orderDatetimeDaysAgo(20, 11, 50),
    totalPrice: 4900,
  },
  {
    sysId: 'payment-007',
    tableInfo: '7',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1007,
    orderDatetime: orderDatetimeDaysAgo(2, 20, 15),
    totalPrice: 32000,
  },
  // 하나의 결제(결제번호) 안에 서로 다른 주문(2004=결제, 2005=취소)이 섞여 있어도, 결제된 주문이
  // 하나라도 있으면 결제 전체는 결제완료로 유지한다. 같은 주문번호 안에서 결제/취소가 섞이는 일은
  // 없다 — 취소는 항상 별도 주문번호 단위로만 발생한다. totalPrice는 실제 결제된 주문(삼겹살)만 합산.
  {
    sysId: 'payment-008',
    tableInfo: '8',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1008,
    orderDatetime: orderDatetimeDaysAgo(3, 12, 40),
    totalPrice: 32000,
  },
  // 주문번호 3건(2006/2007=결제, 2008=취소)을 묶어 처리한 결제. 각 주문마다 메뉴가 여러 개다.
  // totalPrice는 결제된 두 주문(2006, 2007)의 합산 금액만 반영한다.
  {
    sysId: 'payment-009',
    tableInfo: '9',
    paymentType: '카드',
    orderStatus: 'PAID',
    orderNum: 1009,
    orderDatetime: orderDatetimeDaysAgo(1, 19, 50),
    totalPrice: 88000,
  },
];

export const PAYMENT_STATUS_DETAIL_MOCK: PaymentInfoDetailResponse[] = [
  {
    sysId: 'payment-001',
    orderNum: 1001,
    // 결제 하나가 서로 다른 주문(2001, 2002)을 묶어 처리한 예시 — 항목마다 orderNo가 다르다.
    items:
      '[{"orderNo":"2001","menuName":"쌀국수","qty":1,"price":14900,"totalPrice":14900,"paymentYn":"Y","options":[{"optionName":"곱배기","qty":1,"price":1000,"totalPrice":1000},{"optionName":"고기추가","qty":1,"price":2000,"totalPrice":2000}]},{"orderNo":"2002","menuName":"반미","qty":1,"price":6900,"totalPrice":6900,"paymentYn":"Y","options":[{"optionName":"고수","qty":1,"price":0,"totalPrice":0}]}]',
    orderStatus: 'PAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-002',
    orderNum: 1002,
    items:
      '[{"orderNo":"3002","menuName":"파스타","qty":1,"price":6900,"totalPrice":6900,"paymentYn":"","options":[]},{"orderNo":"3002","menuName":"샐러드","qty":1,"price":5500,"totalPrice":5500,"paymentYn":"","options":[]},{"orderNo":"3002","menuName":"콜라","qty":2,"price":2000,"totalPrice":4000,"paymentYn":"","options":[]}]',
    orderStatus: 'UNPAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-003',
    orderNum: 1003,
    items:
      '[{"orderNo":"3003","menuName":"라떼","qty":1,"price":4900,"totalPrice":4900,"paymentYn":"","options":[]}]',
    orderStatus: 'UNPAID',
    cancelReason: '고객 결제 없이 이석',
    cancelDescription: '테이블 정리 중 발견, 결제 미완료 상태로 확인됨. 재방문 시 정산 예정.',
  },
  {
    sysId: 'payment-004',
    orderNum: 1004,
    items:
      '[{"orderNo":"3004","menuName":"스테이크","qty":1,"price":26000,"totalPrice":26000,"paymentYn":"","options":[{"optionName":"미디엄 웰던","qty":1,"price":0,"totalPrice":0}]},{"orderNo":"3004","menuName":"와인","qty":1,"price":9000,"totalPrice":9000,"paymentYn":"","options":[]}]',
    orderStatus: 'UNPAID',
    cancelReason: '고객 요청으로 주문 취소',
    cancelDescription: '주문 후 메뉴 변경 요청으로 결제 전 취소 처리됨.',
  },
  {
    sysId: 'payment-005',
    orderNum: 1005,
    items:
      '[{"orderNo":"3005","menuName":"피자","qty":1,"price":18900,"totalPrice":18900,"paymentYn":"","options":[{"optionName":"치즈크러스트","qty":1,"price":0,"totalPrice":0}]},{"orderNo":"3005","menuName":"맥주","qty":2,"price":4100,"totalPrice":8200,"paymentYn":"","options":[]}]',
    orderStatus: 'UNPAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-006',
    orderNum: 1006,
    items:
      '[{"orderNo":"3006","menuName":"아이스티","qty":1,"price":4900,"totalPrice":4900,"paymentYn":"","options":[]}]',
    orderStatus: 'UNPAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-007',
    orderNum: 1007,
    items:
      '[{"orderNo":"2003","menuName":"짜장면","qty":2,"price":7000,"totalPrice":14000,"paymentYn":"Y","options":[]},{"orderNo":"2003","menuName":"탕수육","qty":1,"price":18000,"totalPrice":18000,"paymentYn":"Y","options":[]}]',
    orderStatus: 'PAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-008',
    orderNum: 1008,
    items:
      '[{"orderNo":"2004","menuName":"삼겹살 2인분","qty":1,"price":32000,"totalPrice":32000,"paymentYn":"Y","options":[]},{"orderNo":"2005","menuName":"소주","qty":1,"price":5000,"totalPrice":5000,"paymentYn":"N","cancelReason":"주문 후 취소 요청","options":[]}]',
    orderStatus: 'PAID',
    cancelReason: '',
    cancelDescription: '',
  },
  {
    sysId: 'payment-009',
    orderNum: 1009,
    items:
      '[{"orderNo":"2006","menuName":"후라이드치킨","qty":1,"price":18000,"totalPrice":18000,"paymentYn":"Y","options":[]},{"orderNo":"2006","menuName":"양념치킨","qty":1,"price":19000,"totalPrice":19000,"paymentYn":"Y","options":[]},{"orderNo":"2006","menuName":"콜라","qty":2,"price":2000,"totalPrice":4000,"paymentYn":"Y","options":[]},{"orderNo":"2006","menuName":"감자튀김","qty":1,"price":7000,"totalPrice":7000,"paymentYn":"Y","options":[]},{"orderNo":"2007","menuName":"마르게리타 피자","qty":1,"price":16000,"totalPrice":16000,"paymentYn":"Y","options":[]},{"orderNo":"2007","menuName":"페퍼로니 피자","qty":1,"price":18000,"totalPrice":18000,"paymentYn":"Y","options":[]},{"orderNo":"2007","menuName":"갈릭브레드","qty":1,"price":6000,"totalPrice":6000,"paymentYn":"Y","options":[]},{"orderNo":"2008","menuName":"탕수육","qty":1,"price":22000,"totalPrice":22000,"paymentYn":"N","cancelReason":"고객 요청으로 주문 전체 취소","options":[]},{"orderNo":"2008","menuName":"볶음밥","qty":1,"price":9000,"totalPrice":9000,"paymentYn":"N","cancelReason":"고객 요청으로 주문 전체 취소","options":[]},{"orderNo":"2008","menuName":"짬뽕","qty":1,"price":8000,"totalPrice":8000,"paymentYn":"N","cancelReason":"고객 요청으로 주문 전체 취소","options":[]}]',
    orderStatus: 'PAID',
    cancelReason: '',
    cancelDescription: '',
  },
];
