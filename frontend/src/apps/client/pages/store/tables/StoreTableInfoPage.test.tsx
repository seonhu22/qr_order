import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreTableInfoPage } from './StoreTableInfoPage';

describe('StoreTableInfoPage', () => {
  it('renders table management search, actions, and selectable rows', async () => {
    const user = userEvent.setup();

    render(<StoreTableInfoPage />);

    expect(screen.getByRole('textbox', { name: '테이블 검색어' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '테이블 정보 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '신규' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: '1번 테이블 선택' }));

    expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled();
  });

  it('opens table create and edit modals and deletes selected rows', async () => {
    const user = userEvent.setup();

    render(<StoreTableInfoPage />);

    await user.click(screen.getByRole('button', { name: '신규' }));
    expect(screen.getByRole('dialog', { name: '테이블 신규' })).toBeInTheDocument();
    expect(screen.getByLabelText('테이블 명')).toHaveValue('신규 테이블');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '1번 테이블 수정' }));
    expect(screen.getByRole('dialog', { name: '테이블 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('홀 중앙 4인석')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('checkbox', { name: '1번 테이블 선택' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(screen.queryByText('홀 중앙 4인석')).not.toBeInTheDocument();
  });

  it('filters table rows by table name or number', async () => {
    const user = userEvent.setup();

    render(<StoreTableInfoPage />);

    await user.type(screen.getByRole('textbox', { name: '테이블 검색어' }), '창가');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('창가 2인석')).toBeInTheDocument();
    expect(screen.queryByText('홀 중앙 4인석')).not.toBeInTheDocument();
  });
});
