import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderStatusManagementHeader } from './OrderStatusManagementHeader';

describe('OrderStatusManagementHeader', () => {
  it.each([
    ['synced', '실시간 동기화(5초)'],
    ['refreshing', '동기화 중'],
    ['error', '동기화 실패 · 기존 주문 표시 중'],
  ] as const)('%s 상태를 텍스트로 구분한다', (syncStatus, label) => {
    render(<OrderStatusManagementHeader syncStatus={syncStatus} onRefresh={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });

  it('새로고침 버튼으로 같은 조회를 요청한다', () => {
    const onRefresh = vi.fn();
    render(<OrderStatusManagementHeader syncStatus="synced" onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
