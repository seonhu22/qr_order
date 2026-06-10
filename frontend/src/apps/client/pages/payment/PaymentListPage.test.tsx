import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentListPage } from './PaymentListPage';

describe('PaymentListPage', () => {
  it('renders payment list and selected detail', async () => {
    const user = userEvent.setup();

    render(<PaymentListPage />);

    expect(screen.getByRole('table', { name: '결제 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '결제 상세' })).toHaveTextContent('PAY-001');

    await user.click(screen.getByRole('row', { name: /PAY-003/ }));

    expect(screen.getByRole('row', { name: /PAY-003/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('article', { name: '결제 상세' })).toHaveTextContent('취소');
  });
});
