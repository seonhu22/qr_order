import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderStatusCard } from './OrderStatusCard';
import type { OrderBoardCardActions, OrderBoardRow } from '../types';

const actions: OrderBoardCardActions = {
  onStartCooking: vi.fn(),
  onServe: vi.fn(),
  onPay: vi.fn(),
  onMoveBack: vi.fn(),
  onCancel: vi.fn(),
  onEdit: vi.fn(),
};

const servedOrder: OrderBoardRow = {
  id: 'order-1',
  orderNo: '1001',
  tableNum: '3',
  orderStatus: 'SERVED',
  paymentStatus: 'PENDING',
  orderDatetime: '2026-10-13T12:00:00',
  menuItems: [],
};

describe('OrderStatusCard', () => {
  it('서빙 완료 주문에는 수정 버튼을 노출하지 않는다', () => {
    render(<OrderStatusCard row={servedOrder} actions={actions} isMoved={false} isPending={false} />);

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '결제처리' })).toBeInTheDocument();
  });

  it('상태 변경 요청 직후 로딩 표시 전에도 중복 클릭을 막는다', () => {
    const receivedOrder: OrderBoardRow = {
      ...servedOrder,
      orderStatus: 'RECEIVED',
    };

    render(<OrderStatusCard row={receivedOrder} actions={actions} isMoved={false} isPending />);

    expect(screen.getByRole('button', { name: '조리시작' })).toBeDisabled();
  });

  it('부모가 새 동작 함수를 전달하면 최신 함수를 실행한다', () => {
    const firstPay = vi.fn();
    const latestPay = vi.fn();
    const { rerender } = render(
      <OrderStatusCard
        row={servedOrder}
        actions={{ ...actions, onPay: firstPay }}
        isMoved={false}
        isPending={false}
      />,
    );

    rerender(
      <OrderStatusCard
        row={servedOrder}
        actions={{ ...actions, onPay: latestPay }}
        isMoved={false}
        isPending={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '결제처리' }));

    expect(latestPay).toHaveBeenCalledWith(servedOrder);
    expect(firstPay).not.toHaveBeenCalled();
  });
});
