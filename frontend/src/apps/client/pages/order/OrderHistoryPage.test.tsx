import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderHistoryPage } from './OrderHistoryPage';

describe('OrderHistoryPage', () => {
  it('renders order history list and detail table', () => {
    render(<OrderHistoryPage />);

    expect(screen.getByRole('table', { name: '주문 이력 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '주문 상세 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /ORD-20260611-001/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('아메리카노')).toBeInTheDocument();
  });

  it('filters order rows and updates selected detail', async () => {
    const user = userEvent.setup();

    render(<OrderHistoryPage />);

    await user.type(screen.getByRole('textbox', { name: '주문 이력 검색어' }), '3번');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('ORD-20260611-003')).toBeInTheDocument();
    expect(screen.queryByText('ORD-20260611-001')).not.toBeInTheDocument();
    expect(screen.getByText('치즈 케이크')).toBeInTheDocument();
  });
});
