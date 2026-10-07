import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StaffCallBoardCard } from './StaffCallBoardCard';

const row = {
  id: 'MASTER-1',
  tableNum: '3',
  calledAt: '2026-09-18T12:00:00',
  items: [{ name: '물' }],
};

describe('StaffCallBoardCard', () => {
  it('해당 카드 처리 중에만 완료 버튼을 비활성화한다', () => {
    const onComplete = vi.fn();
    render(<StaffCallBoardCard row={row} onComplete={onComplete} isPending />);

    const button = screen.getByRole('button', { name: '완료' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('완료 실패 메시지를 카드 안에 표시한다', () => {
    render(<StaffCallBoardCard row={row} onComplete={vi.fn()} error="완료 처리 실패" />);
    expect(screen.getByRole('alert')).toHaveTextContent('완료 처리 실패');
  });
});
