export type OrderShellMenuBadge = 'popular' | 'recommended' | 'limited';

/**
 * 옵션 그룹 하나에서 고를 수 있는 개별 항목.
 * 백엔드 `MenuOptionDetailItem`의 화면 모델이며 `price`는 메뉴 기본가에 더해지는 추가 금액이다.
 */
export type OrderShellOptionChoice = {
  id: string;
  name: string;
  price: number;
  soldOut?: boolean;
  maxQuantity?: number;
  defaultSelected?: boolean;
};

/**
 * 옵션 그룹의 선택 방식.
 *
 * Consumer API의 `selectionType` 코드 01/02/03을 화면에서 읽기 쉬운 값으로 변환한다.
 */
export type OrderShellOptionSelectionType = 'single' | 'multiple' | 'quantity';

/**
 * 옵션 그룹의 화면 모델. 백엔드 `MenuOptionGroupItem`에 대응한다.
 * `maxSelectable`은 `selectionType: 'multiple'`일 때만 의미가 있고, 없으면 상한이 없다.
 */
export type OrderShellOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  selectionType: OrderShellOptionSelectionType;
  maxSelectable?: number;
  choices: OrderShellOptionChoice[];
};

export type OrderShellMenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  soldOut?: boolean;
  badges?: OrderShellMenuBadge[];
  optionGroups?: OrderShellOptionGroup[];
};

/**
 * 장바구니에 담긴 선택 옵션 한 건. 담을 당시의 이름·가격을 그대로 보관해
 * 메뉴 정보가 나중에 바뀌어도 담긴 줄의 표시가 흔들리지 않게 한다.
 */
export type OrderShellCartOption = {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  price: number;
  quantity: number;
};

export type OrderShellCategory = {
  id: string;
  name: string;
};

export type OrderShellMenuMain = {
  storeName: string;
  tableNum: number;
  categories: OrderShellCategory[];
  menus: OrderShellMenuItem[];
};

export type OrderShellCartLine = {
  /** 같은 메뉴라도 옵션 조합이 다르면 다른 줄이 되도록 옵션까지 반영한 키 (`buildCartKey`) */
  cartKey: string;
  menuId: string;
  name: string;
  /** 메뉴 기본가 (옵션 추가 금액은 `options`에 따로 둔다) */
  price: number;
  qty: number;
  options: OrderShellCartOption[];
};

export type OrderShellMenuGroup = {
  category: string;
  items: OrderShellMenuItem[];
};
