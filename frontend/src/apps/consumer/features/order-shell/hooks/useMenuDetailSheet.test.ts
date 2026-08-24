import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAX_MENU_QTY, useMenuDetailSheet } from './useMenuDetailSheet';
import type { OrderShellMenuItem } from '../types';

const plainItem: OrderShellMenuItem = {
  id: 'menu-3',
  name: '된장찌개',
  category: '한식',
  price: 8000,
};

const itemWithOptions: OrderShellMenuItem = {
  id: 'menu-1',
  name: '불고기 정식',
  category: '한식',
  price: 12000,
  optionGroups: [
    {
      id: 'rice',
      name: '밥 선택',
      required: true,
      selectionType: 'single',
      choices: [
        { id: 'white', name: '백미', price: 0 },
        { id: 'multigrain', name: '잡곡밥', price: 500 },
      ],
    },
    {
      id: 'extra',
      name: '추가 선택',
      required: false,
      selectionType: 'multiple',
      maxSelectable: 2,
      choices: [
        { id: 'egg', name: '계란후라이', price: 1000 },
        { id: 'cheese', name: '치즈 토핑', price: 1500 },
        { id: 'noodle', name: '당면 사리', price: 2000 },
      ],
    },
  ],
};

describe('useMenuDetailSheet', () => {
  it('옵션이 없는 메뉴는 총액이 기본가 × 수량이고 바로 담을 수 있다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(plainItem));

    expect(result.current.totalPrice).toBe(8000);
    expect(result.current.canAddToCart).toBe(true);

    act(() => result.current.increaseQty());
    expect(result.current.totalPrice).toBe(16000);
  });

  it('수량은 1 미만으로 내려가지 않는다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(plainItem));

    act(() => result.current.decreaseQty());
    expect(result.current.qty).toBe(1);
  });

  it('수량은 상한을 넘지 않는다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(plainItem));

    for (let i = 0; i < MAX_MENU_QTY + 5; i += 1) {
      act(() => result.current.increaseQty());
    }

    expect(result.current.qty).toBe(MAX_MENU_QTY);
  });

  it('필수 단일 선택 그룹은 첫 항목이 미리 선택된다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));

    expect(result.current.isChoiceSelected('rice', 'white')).toBe(true);
    expect(result.current.canAddToCart).toBe(true);
  });

  it('단일 선택은 다른 항목을 고르면 교체된다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));
    const riceGroup = itemWithOptions.optionGroups![0];

    act(() => result.current.toggleChoice(riceGroup, 'multigrain'));

    expect(result.current.isChoiceSelected('rice', 'white')).toBe(false);
    expect(result.current.isChoiceSelected('rice', 'multigrain')).toBe(true);
    expect(result.current.totalPrice).toBe(12500);
  });

  it('단일 선택은 이미 고른 항목을 다시 눌러도 해제되지 않는다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));
    const riceGroup = itemWithOptions.optionGroups![0];

    act(() => result.current.toggleChoice(riceGroup, 'white'));

    expect(result.current.isChoiceSelected('rice', 'white')).toBe(true);
  });

  it('복수 선택은 토글되고 옵션 금액이 합산된다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));
    const extraGroup = itemWithOptions.optionGroups![1];

    act(() => result.current.toggleChoice(extraGroup, 'egg'));
    expect(result.current.totalPrice).toBe(13000);

    act(() => result.current.toggleChoice(extraGroup, 'egg'));
    expect(result.current.totalPrice).toBe(12000);
  });

  it('복수 선택 상한에 도달하면 새 항목은 막고 이미 고른 항목은 해제할 수 있다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));
    const extraGroup = itemWithOptions.optionGroups![1];

    act(() => result.current.toggleChoice(extraGroup, 'egg'));
    act(() => result.current.toggleChoice(extraGroup, 'cheese'));

    expect(result.current.isChoiceDisabled(extraGroup, extraGroup.choices[2])).toBe(true);
    expect(result.current.isChoiceDisabled(extraGroup, extraGroup.choices[0])).toBe(false);

    act(() => result.current.toggleChoice(extraGroup, 'noodle'));
    expect(result.current.isChoiceSelected('extra', 'noodle')).toBe(false);
  });

  it('필수 그룹이 비어 있으면 담기를 막는다', () => {
    const requiredMultiple: OrderShellMenuItem = {
      ...plainItem,
      optionGroups: [
        {
          id: 'sauce',
          name: '소스 선택',
          required: true,
          selectionType: 'multiple',
          choices: [{ id: 'soy', name: '간장', price: 0 }],
        },
      ],
    };

    const { result } = renderHook(() => useMenuDetailSheet(requiredMultiple));

    expect(result.current.canAddToCart).toBe(false);

    act(() => result.current.toggleChoice(requiredMultiple.optionGroups![0], 'soy'));
    expect(result.current.canAddToCart).toBe(true);
  });

  it('품절 항목은 기본 선택에서 제외되고 고를 수 없다', () => {
    const withSoldOut: OrderShellMenuItem = {
      ...plainItem,
      optionGroups: [
        {
          id: 'rice',
          name: '밥 선택',
          required: true,
          selectionType: 'single',
          choices: [
            { id: 'white', name: '백미', price: 0, soldOut: true },
            { id: 'multigrain', name: '잡곡밥', price: 500 },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useMenuDetailSheet(withSoldOut));
    const group = withSoldOut.optionGroups![0];

    expect(result.current.isChoiceSelected('rice', 'multigrain')).toBe(true);
    expect(result.current.isChoiceDisabled(group, group.choices[0])).toBe(true);
  });

  it('선택한 옵션을 장바구니 옵션 모양으로 넘긴다', () => {
    const { result } = renderHook(() => useMenuDetailSheet(itemWithOptions));

    expect(result.current.selectedOptions).toEqual([
      { groupId: 'rice', groupName: '밥 선택', choiceId: 'white', choiceName: '백미', price: 0 },
    ]);
  });
});
