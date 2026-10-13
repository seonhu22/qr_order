import { describe, expect, it } from 'vitest';
import { buildOrderRevisionRequest, mapOrderRevisionCatalog } from './orderRevisionApi';
import type { OrderBoardRow } from '../types';
import { getEditableOrdersForTable } from '../utils';

const original: OrderBoardRow = {
  id: 'order-2', orderNo: '0002', tableNum: '3', orderStatus: 'RECEIVED', paymentStatus: 'PENDING',
  orderDatetime: '2026-10-13T10:00:00',
  menuItems: [
    { id: 'draft-detail-b', sourceSysId: 'detail-b', name: 'B', quantity: 1, unitPrice: 2000, options: [] },
    { id: 'draft-detail-a', sourceSysId: 'detail-a', name: 'A', quantity: 1, unitPrice: 1000, options: [] },
  ],
};

describe('orderRevisionApi mapper', () => {
  it('maps catalog rules without parsing source sysIds from draft ids', () => {
    const result = mapOrderRevisionCatalog({
      success: true, message: 'ok', data: { categories: [{
        categorySysId: 'category-1', categoryName: '메인', menus: [{
          menuSysId: 'menu-source', menuName: '메뉴', menuPrice: 1000, optionUseYn: 'Y', soldOutYn: 'N',
          optionGroups: [{
            optionGroupSysId: 'group-source', groupName: '선택', requiredYn: 'Y', selectionType: '03',
            options: [{ menuOptionSysId: 'option-source', menuOptionName: '추가', menuOptionPrice: 500, maximumNum: 3, defaultYn: 'Y', soldOutYn: 'N' }],
          }],
        }],
      }] } },
    );

    expect(result[0]).toMatchObject({ id: 'catalog-menu-menu-source', sourceSysId: 'menu-source', soldOut: false });
    expect(result[0]?.optionCategories[0]).toMatchObject({ sourceSysId: 'group-source', selectionType: 'stepper', required: true });
    expect(result[0]?.optionCategories[0]?.options[0]).toMatchObject({ sourceSysId: 'option-source', maximumNum: 3, defaultSelected: true });
  });

  it('builds a canonical payload from explicit source sysIds', () => {
    const added: OrderBoardRow = {
      ...original, id: 'draft-order-random', orderNo: '9999',
      menuItems: [{
        id: 'draft-menu-random', sourceSysId: 'menu-z', name: '새 메뉴', quantity: 2, unitPrice: 3000,
        options: [
          { id: 'draft-option-2', sourceSysId: 'option-z', name: 'Z', quantity: 1, unitPrice: 0 },
          { id: 'draft-option-1', sourceSysId: 'option-a', name: 'A', quantity: 1, unitPrice: 0 },
        ],
      }],
    };
    const retained = { ...original, menuItems: [original.menuItems[1]!] };

    expect(buildOrderRevisionRequest('request-1', [original], [retained, added])).toEqual({
      clientRequestId: 'request-1',
      orderGroupIds: ['order-2'],
      removeDetailIds: ['detail-b'],
      addedItems: [{
        menuSysId: 'menu-z', quantity: 2,
        options: [{ optionSysId: 'option-a', quantity: 1 }, { optionSysId: 'option-z', quantity: 1 }],
      }],
    });
  });

  it('includes only RECEIVED and COOKING order groups from a mixed table', () => {
    const rows = [
      { ...original, id: 'received', sourceSysId: 'group-received', orderStatus: 'RECEIVED' as const },
      { ...original, id: 'cooking', sourceSysId: 'group-cooking', orderStatus: 'COOKING' as const },
      { ...original, id: 'served', sourceSysId: 'group-served', orderStatus: 'SERVED' as const },
      { ...original, id: 'cancelled', sourceSysId: 'group-cancelled', orderStatus: 'CANCELLED' as const },
      { ...original, id: 'paid', sourceSysId: 'group-paid', orderStatus: 'SERVED' as const, paymentStatus: 'PAID' as const },
    ];
    const editable = getEditableOrdersForTable(rows, '3');

    expect(editable.map((row) => row.id)).toEqual(['received', 'cooking']);
    expect(buildOrderRevisionRequest('request-2', editable, editable).orderGroupIds).toEqual([
      'group-cooking',
      'group-received',
    ]);
  });
});
