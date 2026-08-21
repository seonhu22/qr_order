export type OrderShellMenuBadge = 'popular' | 'recommended' | 'limited';

export type OrderShellMenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  soldOut?: boolean;
  badges?: OrderShellMenuBadge[];
};

export type OrderShellCartLine = {
  cartKey: string;
  menuId: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderShellMenuGroup = {
  category: string;
  items: OrderShellMenuItem[];
};
