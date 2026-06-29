export type OrderBoardStatus = 'RECEIVED' | 'COOKING' | 'SERVED' | 'CANCELLED';
export type OrderBoardPaymentStatus = 'PENDING' | 'PAID' | 'UNPAID' | 'REFUNDED';

export type OrderBoardOptionItem = {
  id: string;
  name: string;
  quantity: number;
  /** 옵션 1개당 가격 */
  unitPrice: number;
};

export type OrderBoardMenuItem = {
  id: string;
  name: string;
  quantity: number;
  /** 메뉴 1개당 가격(옵션 가격 제외) */
  unitPrice: number;
  options: OrderBoardOptionItem[];
};

export type OrderBoardRow = {
  id: string;
  orderNo: string;
  tableNum: string;
  orderStatus: OrderBoardStatus;
  paymentStatus: OrderBoardPaymentStatus;
  /** ISO 형식("YYYY-MM-DDTHH:mm:ss") 주문 접수 시각 */
  orderDatetime: string;
  /** 취소 처리 시각. CANCELLED 상태일 때만 존재하며 "취소는 당일만 표시" 규칙의 기준이 된다. */
  cancelledAt?: string;
  /** 취소사유 선택값. CANCELLED 상태일 때만 존재한다. */
  cancelReason?: string;
  /** 취소사유가 "기타"일 때 입력한 상세 내용. */
  cancelDescription?: string;
  /** 미결제사유 선택값. UNPAID 상태일 때만 존재한다. */
  unpaidReason?: string;
  /** 미결제사유가 "기타"일 때 입력한 상세 내용. */
  unpaidDescription?: string;
  /** 메뉴+옵션 단가를 기준으로 계산하는 주문 총액은 `calculateOrderTotal`(utils.ts)을 쓴다. */
  menuItems: OrderBoardMenuItem[];
};

export type OrderBoardColumnData = {
  status: OrderBoardStatus;
  label: string;
  rows: OrderBoardRow[];
};

export type OrderBoardCardActions = {
  onStartCooking: (id: string) => void;
  onServe: (id: string) => void;
  onPay: (row: OrderBoardRow) => void;
  onMoveBack: (id: string) => void;
  onCancel: (row: OrderBoardRow) => void;
  onEdit: (row: OrderBoardRow) => void;
  onShowCancelReason: (row: OrderBoardRow) => void;
  /** 취소 컬럼에서 카드를 화면에서만 지운다(실제 데이터는 삭제하지 않음). */
  onDismiss: (id: string) => void;
};

/** "주문 수정" 모달의 "메뉴 추가" > "옵션 추가"에서 고를 수 있는 옵션 카탈로그 항목 */
export type MenuCatalogOption = {
  id: string;
  name: string;
  /** 옵션 1개당 가격 */
  unitPrice: number;
};

export type MenuCatalogOptionSelectionType = 'single' | 'multi';

/**
 * 옵션을 묶어서 보여줄 카테고리(예: "맵기 조절", "고기추가").
 * - `single`: 카테고리 내에서 정확히 1개를 필수로 선택한다(라디오 동작, 기본값은 첫 옵션).
 * - `multi`: 옵션별로 수량을 따로 선택한다(+/- 조절, 0개면 미선택).
 */
export type MenuCatalogOptionCategory = {
  category: string;
  selectionType: MenuCatalogOptionSelectionType;
  options: MenuCatalogOption[];
};

/** "주문 수정" 모달의 "메뉴 추가"에서 고를 수 있는 메뉴 카탈로그 항목 */
export type MenuCatalogItem = {
  id: string;
  name: string;
  /** 메뉴 1개당 가격(옵션 가격 제외) */
  unitPrice: number;
  /** 메뉴 목록을 묶어서 보여줄 분류명(예: "메인 메뉴", "음료수") */
  category: string;
  optionCategories: MenuCatalogOptionCategory[];
};
