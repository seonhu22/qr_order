import { render, screen } from '@testing-library/react';
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
});
