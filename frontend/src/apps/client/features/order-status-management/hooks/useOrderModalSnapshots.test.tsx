import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OrderBoardRow } from '../types';
import { useOrderCancelModalFlow } from './useOrderCancelModalFlow';
import { useOrderEditModalFlow } from './useOrderEditModalFlow';
import { useOrderPaymentModalFlow } from './useOrderPaymentModalFlow';

function createRow(): OrderBoardRow {
  return {
    id: 'order-1',
    orderNo: '0001',
    tableNum: '1',
    orderStatus: 'RECEIVED',
    paymentStatus: 'PENDING',
    orderDatetime: '2026-08-05T12:00:00',
    menuItems: [{
      id: 'menu-1',
      name: '원래 메뉴',
      quantity: 1,
      unitPrice: 1000,
      options: [{ id: 'option-1', name: '원래 옵션', quantity: 1, unitPrice: 100 }],
    }],
  };
}

describe('order modal open-time snapshots', () => {
  it('취소 모달은 원본 query 객체 변경의 영향을 받지 않는다', () => {
    const row = createRow();
    const { result } = renderHook(() => useOrderCancelModalFlow({ onConfirmCancel: vi.fn() }));
    act(() => result.current.openCancelModal(row));

    row.orderNo = '9999';
    row.menuItems[0].name = '변경 메뉴';

    expect(result.current.targetRow?.orderNo).toBe('0001');
    expect(result.current.targetRow?.menuItems[0].name).toBe('원래 메뉴');
  });

  it('결제 모달은 테이블 주문과 옵션까지 독립 복사한다', () => {
    const row = createRow();
    const { result } = renderHook(() => useOrderPaymentModalFlow({
      onConfirmPaid: vi.fn(),
      onConfirmUnpaid: vi.fn(),
    }));
    act(() => result.current.openPaymentModal(row, [row]));

    row.menuItems[0].options[0].name = '변경 옵션';
    expect(result.current.tableOrders[0].menuItems[0].options[0].name).toBe('원래 옵션');
  });

  it('결제완료 API가 성공한 뒤에만 완료 안내를 연다', async () => {
    const row = createRow();
    const onConfirmPaid = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOrderPaymentModalFlow({
      onConfirmPaid,
      onConfirmUnpaid: vi.fn(),
    }));

    act(() => {
      result.current.openPaymentModal(row, [row]);
      result.current.choosePaid();
    });
    act(() => result.current.changePaymentType('카드'));
    await act(async () => result.current.confirmReceipt());

    expect(onConfirmPaid).toHaveBeenCalledWith(['order-1'], '카드');
    expect(result.current.isReceiptOpen).toBe(false);
    expect(result.current.isPaidNoticeOpen).toBe(true);
  });

  it('결제완료 API가 실패하면 영수증 화면과 오류를 유지한다', async () => {
    const row = createRow();
    const { result } = renderHook(() => useOrderPaymentModalFlow({
      onConfirmPaid: vi.fn().mockRejectedValue(new Error('결제 서버 오류')),
      onConfirmUnpaid: vi.fn(),
    }));

    act(() => {
      result.current.openPaymentModal(row, [row]);
      result.current.choosePaid();
    });
    act(() => result.current.changePaymentType('카드'));
    await act(async () => result.current.confirmReceipt());

    expect(result.current.isReceiptOpen).toBe(true);
    expect(result.current.isPaidNoticeOpen).toBe(false);
    expect(result.current.submitError).toBe('결제 서버 오류');
  });

  it('결제수단을 선택하지 않으면 결제완료 처리를 호출하지 않는다', async () => {
    const row = createRow();
    const onConfirmPaid = vi.fn();
    const { result } = renderHook(() => useOrderPaymentModalFlow({
      onConfirmPaid,
      onConfirmUnpaid: vi.fn(),
    }));

    act(() => {
      result.current.openPaymentModal(row, [row]);
      result.current.choosePaid();
    });
    await act(async () => result.current.confirmReceipt());

    expect(onConfirmPaid).not.toHaveBeenCalled();
    expect(result.current.paymentTypeError).toBe(true);
    expect(result.current.isReceiptOpen).toBe(true);
  });

  it('수정 모달은 Polling 원본과 분리된 draft를 유지한다', () => {
    const row = createRow();
    const { result } = renderHook(() => useOrderEditModalFlow({ onConfirmEdit: vi.fn() }));
    act(() => result.current.openEditModal([row]));

    row.menuItems[0].name = 'Polling 변경 메뉴';
    expect(result.current.draftOrders[0].menuItems[0].name).toBe('원래 메뉴');
  });
});
