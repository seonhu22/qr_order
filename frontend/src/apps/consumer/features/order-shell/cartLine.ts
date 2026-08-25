import type { OrderShellCartLine, OrderShellCartOption } from './types';

/**
 * 장바구니 줄을 식별하는 키를 만든다.
 *
 * 같은 메뉴라도 옵션 조합이 다르면 다른 줄로 남아야 하므로 메뉴 id 뒤에 선택한 옵션 id를 붙인다.
 * 선택 순서가 달라도 같은 조합이면 같은 줄로 합쳐지도록 정렬한 뒤 이어붙인다.
 * 옵션이 없으면 메뉴 id만 사용해 옵션 도입 전과 같은 키가 된다.
 */
export function buildCartKey(menuId: string, options: OrderShellCartOption[]): string {
  if (options.length === 0) return menuId;

  const choiceIds = options
    .map((option) => `${option.choiceId}:${option.quantity}`)
    .sort()
    .join('+');

  return `${menuId}__${choiceIds}`;
}

/** 옵션 추가 금액 합계. */
export function sumOptionPrice(
  options: Pick<OrderShellCartOption, 'price' | 'quantity'>[],
): number {
  return options.reduce((sum, option) => sum + option.price * option.quantity, 0);
}

/** 메뉴 1개당 가격(기본가 + 옵션 추가 금액). */
export function calcUnitPrice(
  basePrice: number,
  options: Pick<OrderShellCartOption, 'price' | 'quantity'>[],
) {
  return basePrice + sumOptionPrice(options);
}

/** 장바구니 줄 하나의 합계(1개당 가격 × 수량). */
export function calcCartLinePrice(line: OrderShellCartLine): number {
  return calcUnitPrice(line.price, line.options) * line.qty;
}
