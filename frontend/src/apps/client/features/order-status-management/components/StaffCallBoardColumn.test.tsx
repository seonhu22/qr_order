import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StaffCallBoardColumn } from './StaffCallBoardColumn';

const defaultProps = {
  rows: [],
  onComplete: vi.fn(async () => undefined),
  pendingIds: new Set<string>(),
  errors: new Map<string, string>(),
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
};

describe('StaffCallBoardColumn', () => {
  it('최초 조회 중에는 빈 상태 대신 로딩 상태를 표시한다', () => {
    render(<StaffCallBoardColumn {...defaultProps} isLoading />);

    expect(screen.getByText('직원호출을 불러오는 중입니다.')).toBeInTheDocument();
    expect(screen.queryByText('직원호출이 없습니다.')).not.toBeInTheDocument();
  });

  it('조회 실패 시 오류와 다시 시도 동작을 표시한다', () => {
    const onRetry = vi.fn();
    render(<StaffCallBoardColumn {...defaultProps} isError onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('직원호출을 불러오지 못했습니다.');
    expect(screen.queryByText('직원호출이 없습니다.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
