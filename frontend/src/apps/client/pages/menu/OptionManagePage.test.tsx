import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionManagePage } from './OptionManagePage';

describe('OptionManagePage', () => {
  it('renders option group and option item active state', async () => {
    const user = userEvent.setup();

    render(<OptionManagePage />);

    expect(screen.getByRole('table', { name: '옵션 그룹 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '옵션 항목 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /음료 사이즈/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('row', { name: /토핑 추가/ }));
    expect(screen.getByRole('row', { name: /토핑 추가/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('샷 추가')).toBeInTheDocument();
  });

  it('opens option item edit modal for order option and quantity setting rows', async () => {
    const user = userEvent.setup();

    render(<OptionManagePage />);

    await user.click(screen.getByRole('button', { name: 'S 사이즈 수정' }));
    expect(screen.getByRole('dialog', { name: '옵션 항목 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('주문옵션')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('row', { name: /수량 선택/ }));
    await user.click(screen.getByRole('button', { name: '기본 수량 수정' }));
    expect(screen.getByRole('dialog', { name: '옵션 항목 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('수량 설정')).toBeInTheDocument();
  });
});
