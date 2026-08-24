import { describe, expect, it } from 'vitest';
import { buildCartKey, calcCartLinePrice, calcUnitPrice, sumOptionPrice } from './cartLine';
import type { OrderShellCartLine, OrderShellCartOption } from './types';

function option(choiceId: string, price: number): OrderShellCartOption {
  return {
    groupId: 'group-1',
    groupName: '그룹',
    choiceId,
    choiceName: choiceId,
    price,
  };
}

describe('buildCartKey', () => {
  it('옵션이 없으면 메뉴 id를 그대로 쓴다', () => {
    expect(buildCartKey('menu-3', [])).toBe('menu-3');
  });

  it('선택 순서가 달라도 같은 옵션 조합이면 같은 키가 된다', () => {
    const first = buildCartKey('menu-1', [option('egg', 1000), option('cheese', 1500)]);
    const second = buildCartKey('menu-1', [option('cheese', 1500), option('egg', 1000)]);

    expect(first).toBe(second);
  });

  it('옵션 조합이 다르면 다른 키가 된다', () => {
    const withEgg = buildCartKey('menu-1', [option('egg', 1000)]);
    const withCheese = buildCartKey('menu-1', [option('cheese', 1500)]);

    expect(withEgg).not.toBe(withCheese);
  });
});

describe('가격 계산', () => {
  it('옵션 추가 금액을 합산한다 — 음수 옵션도 그대로 더한다', () => {
    expect(sumOptionPrice([option('a', 1000), option('b', -500)])).toBe(500);
  });

  it('1개당 가격은 기본가 + 옵션 추가 금액이다', () => {
    expect(calcUnitPrice(12000, [option('a', 500)])).toBe(12500);
  });

  it('줄 합계는 1개당 가격 × 수량이다', () => {
    const line: OrderShellCartLine = {
      cartKey: 'menu-1__a',
      menuId: 'menu-1',
      name: '불고기 정식',
      price: 12000,
      qty: 3,
      options: [option('a', 500)],
    };

    expect(calcCartLinePrice(line)).toBe(37500);
  });
});
