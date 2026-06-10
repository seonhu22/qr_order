import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuManagePage } from './MenuManagePage';

describe('MenuManagePage', () => {
  it('renders category and menu tables with create modals', async () => {
    const user = userEvent.setup();

    render(<MenuManagePage />);

    expect(screen.getByRole('table', { name: '카테고리 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '메뉴 목록 테이블' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '카테고리 신규' }));
    expect(screen.getByRole('dialog', { name: '카테고리 신규/수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('카테고리 명')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '메뉴 신규' }));
    expect(screen.getByRole('dialog', { name: '메뉴 신규/수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('메뉴 명')).toBeInTheDocument();
  });

  it('filters menu rows by keyword', async () => {
    const user = userEvent.setup();

    render(<MenuManagePage />);

    await user.type(screen.getByRole('textbox', { name: '메뉴 검색어' }), '아메리카노');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('아메리카노')).toBeInTheDocument();
    expect(screen.queryByText('치즈 케이크')).not.toBeInTheDocument();
  });
});
