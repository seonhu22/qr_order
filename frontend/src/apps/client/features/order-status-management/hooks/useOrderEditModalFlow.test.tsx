import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOrderEditModalFlow } from './useOrderEditModalFlow';
import type { OrderBoardRow } from '../types';
import type { MenuCatalogItem } from '../types';

const order: OrderBoardRow = {
  id: 'order-1', orderNo: '0001', tableNum: '3', orderStatus: 'RECEIVED', paymentStatus: 'PENDING',
  orderDatetime: '2026-10-13T10:00:00',
  menuItems: [{ id: 'detail-1', sourceSysId: 'detail-1', name: '메뉴', quantity: 1, unitPrice: 1000, options: [] }],
};

const optionCatalog: MenuCatalogItem[] = [{
  id: 'catalog-menu', sourceSysId: 'menu-source', name: '메뉴', unitPrice: 1000, category: '메인', soldOut: false,
  optionCategories: [
    {
      category: '단일', sourceSysId: 'group-single', selectionType: 'single', required: false,
      options: [{ id: 'single-a', sourceSysId: 'single-source', name: 'A', unitPrice: 0, maximumNum: 0, defaultSelected: false, soldOut: false }],
    },
    {
      category: '체크', sourceSysId: 'group-checkbox', selectionType: 'checkbox', required: false,
      options: [{ id: 'checkbox-a', sourceSysId: 'checkbox-source', name: 'B', unitPrice: 0, maximumNum: 0, defaultSelected: false, soldOut: false }],
    },
    {
      category: '수량', sourceSysId: 'group-stepper', selectionType: 'stepper', required: true,
      options: [{ id: 'stepper-a', sourceSysId: 'stepper-source', name: 'C', unitPrice: 0, maximumNum: 3, defaultSelected: false, soldOut: false }],
    },
  ],
}, {
  id: 'soldout-required-menu', sourceSysId: 'soldout-menu-source', name: '품절 옵션 메뉴', unitPrice: 1000, category: '메인', soldOut: false,
  optionCategories: [{
    category: '필수', sourceSysId: 'soldout-group', selectionType: 'single', required: true,
    options: [{ id: 'soldout-option', sourceSysId: 'soldout-source', name: '품절', unitPrice: 0, maximumNum: 0, defaultSelected: true, soldOut: true }],
  }],
}];

describe('useOrderEditModalFlow save lifecycle', () => {
  it('keeps the request id and draft after failure, then resets only after success', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('실패')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useOrderEditModalFlow({ catalog: [], onConfirmEdit: save }));

    act(() => result.current.openEditModal([order]));
    const openedRequestId = result.current.clientRequestId;
    act(() => result.current.cancelMenuLine('order-1', 'detail-1'));
    const changedRequestId = result.current.clientRequestId;
    expect(changedRequestId).not.toBe(openedRequestId);

    act(() => result.current.requestConfirm());
    await act(async () => { await result.current.confirmSave(); });
    expect(result.current.saveError).toBe('실패');
    expect(result.current.isEditorOpen).toBe(true);
    expect(result.current.clientRequestId).toBe(changedRequestId);

    await act(async () => { await result.current.confirmSave(); });
    expect(save.mock.calls[0]?.[0]).toBe(changedRequestId);
    expect(save.mock.calls[1]?.[0]).toBe(changedRequestId);
    expect(result.current.isNoticeOpen).toBe(true);
    expect(result.current.isEditorOpen).toBe(false);
  });

  it('applies optional single, checkbox quantity 1, and stepper maximum rules', () => {
    const { result } = renderHook(() => useOrderEditModalFlow({ catalog: optionCatalog, onConfirmEdit: vi.fn() }));
    act(() => result.current.clickAddCatalogMenu('catalog-menu'));

    expect(result.current.optionPicker.selectedOptionIds).toEqual([]);
    expect(result.current.canConfirmOptions).toBe(false);

    act(() => result.current.selectOptionPickerSingle(['single-a'], 'single-a'));
    expect(result.current.optionPicker.selectedOptionIds).toEqual(['single-a']);
    act(() => result.current.selectOptionPickerSingle(['single-a'], 'single-a'));
    expect(result.current.optionPicker.selectedOptionIds).toEqual([]);

    act(() => result.current.changeOptionPickerOptionQuantity('checkbox-a', 2, 1));
    expect(result.current.optionPicker.optionQuantities['checkbox-a']).toBe(1);
    act(() => result.current.changeOptionPickerOptionQuantity('stepper-a', 4, 3));
    expect(result.current.optionPicker.optionQuantities['stepper-a']).toBe(3);
    expect(result.current.canConfirmOptions).toBe(true);
  });

  it('does not preselect an all-sold-out required group and blocks confirmation', () => {
    const { result } = renderHook(() => useOrderEditModalFlow({ catalog: optionCatalog, onConfirmEdit: vi.fn() }));
    act(() => result.current.clickAddCatalogMenu('soldout-required-menu'));

    expect(result.current.optionPicker.selectedOptionIds).toEqual([]);
    expect(result.current.canConfirmOptions).toBe(false);
    act(() => result.current.confirmOptionPicker());
    expect(result.current.addedItems).toEqual([]);
  });
});
