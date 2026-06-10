export type MenuCategory = {
  id: string;
  name: string;
  displayOrder: number;
  useYn: 'Y' | 'N';
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  status: '판매중' | '품절' | '숨김';
  useYn: 'Y' | 'N';
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  valueType: '주문옵션' | '수량 설정';
  required: 'Y' | 'N';
  useYn: 'Y' | 'N';
};

export type MenuOptionItem = {
  id: string;
  groupId: string;
  name: string;
  valueType: '주문옵션' | '수량 설정';
  price: number;
  quantity: number;
  useYn: 'Y' | 'N';
};
