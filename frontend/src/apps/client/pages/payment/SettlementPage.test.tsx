import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettlementPage } from './SettlementPage';

describe('SettlementPage', () => {
  it('renders settlement summary and filters rows', async () => {
    const user = userEvent.setup();

    render(<SettlementPage />);

    expect(screen.getByText('총 정산 금액')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '정산 목록 테이블' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '정산 검색어' }), '2026-06-10');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('SET-20260610')).toBeInTheDocument();
    expect(screen.queryByText('SET-20260609')).not.toBeInTheDocument();
  });
});
