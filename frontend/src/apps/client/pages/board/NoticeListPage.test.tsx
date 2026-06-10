import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoticeListPage } from './NoticeListPage';

describe('NoticeListPage', () => {
  it('renders notices and opens notice detail modal', async () => {
    const user = userEvent.setup();

    render(<NoticeListPage />);

    expect(screen.getByRole('table', { name: '공지사항 목록 테이블' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '서비스 점검 안내 조회' }));

    expect(screen.getByRole('dialog', { name: '공지사항 조회' })).toBeInTheDocument();
    expect(screen.getByText('서비스 안정화를 위한 점검이 예정되어 있습니다.')).toBeInTheDocument();
  });
});
