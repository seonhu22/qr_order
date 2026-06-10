import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QnaManagePage } from './QnaManagePage';

describe('QnaManagePage', () => {
  it('opens qna detail modal and shows answer completed alert', async () => {
    const user = userEvent.setup();

    render(<QnaManagePage />);

    await user.click(screen.getByRole('button', { name: '영수증 출력 문의 조회' }));
    expect(screen.getByRole('dialog', { name: '문의사항 조회' })).toBeInTheDocument();
    expect(screen.getByText('답변 완료된 문의입니다.')).toBeInTheDocument();
  });

  it('opens new inquiry modal', async () => {
    const user = userEvent.setup();

    render(<QnaManagePage />);

    await user.click(screen.getByRole('button', { name: '문의사항 신규' }));
    expect(screen.getByRole('dialog', { name: '문의사항 신규' })).toBeInTheDocument();
    expect(screen.getByLabelText('문의 제목')).toBeInTheDocument();
  });
});
