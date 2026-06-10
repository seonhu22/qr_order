import type { MenuCategory, MenuItem, MenuOptionGroup, MenuOptionItem } from '../types';

export const MENU_CATEGORY_ROWS: MenuCategory[] = [
  { id: 'cat-coffee', name: '커피', displayOrder: 1, useYn: 'Y' },
  { id: 'cat-dessert', name: '디저트', displayOrder: 2, useYn: 'Y' },
  { id: 'cat-season', name: '시즌 메뉴', displayOrder: 3, useYn: 'N' },
];

export const MENU_ITEM_ROWS: MenuItem[] = [
  { id: 'menu-americano', categoryId: 'cat-coffee', name: '아메리카노', price: 4500, status: '판매중', useYn: 'Y' },
  { id: 'menu-latte', categoryId: 'cat-coffee', name: '카페라떼', price: 5200, status: '판매중', useYn: 'Y' },
  { id: 'menu-cheese-cake', categoryId: 'cat-dessert', name: '치즈 케이크', price: 6500, status: '품절', useYn: 'Y' },
  { id: 'menu-strawberry', categoryId: 'cat-season', name: '딸기 라떼', price: 6200, status: '숨김', useYn: 'N' },
];

export const MENU_OPTION_GROUP_ROWS: MenuOptionGroup[] = [
  { id: 'group-size', name: '음료 사이즈', valueType: '주문옵션', required: 'Y', useYn: 'Y' },
  { id: 'group-topping', name: '토핑 추가', valueType: '주문옵션', required: 'N', useYn: 'Y' },
  { id: 'group-quantity', name: '수량 선택', valueType: '수량 설정', required: 'Y', useYn: 'Y' },
];

export const MENU_OPTION_ITEM_ROWS: MenuOptionItem[] = [
  { id: 'item-size-s', groupId: 'group-size', name: 'S 사이즈', valueType: '주문옵션', price: 0, quantity: 1, useYn: 'Y' },
  { id: 'item-size-l', groupId: 'group-size', name: 'L 사이즈', valueType: '주문옵션', price: 700, quantity: 1, useYn: 'Y' },
  { id: 'item-shot', groupId: 'group-topping', name: '샷 추가', valueType: '주문옵션', price: 500, quantity: 1, useYn: 'Y' },
  { id: 'item-quantity-default', groupId: 'group-quantity', name: '기본 수량', valueType: '수량 설정', price: 0, quantity: 1, useYn: 'Y' },
  { id: 'item-quantity-max', groupId: 'group-quantity', name: '최대 수량', valueType: '수량 설정', price: 0, quantity: 10, useYn: 'Y' },
];
