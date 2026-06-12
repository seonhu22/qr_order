import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QRCodeManagePage } from './QRCodeManagePage';

describe('QRCodeManagePage', () => {
  it('renders QR management table and table-number combo boxes', async () => {
    const user = userEvent.setup();

    render(<QRCodeManagePage />);

    expect(screen.getByRole('table', { name: 'QR 코드 목록 테이블' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '신규' })).toBeInTheDocument();

    const firstRow = screen.getByRole('row', { name: /QR-001/ });
    await user.click(within(firstRow).getByRole('combobox', { name: '1번 테이블' }));

    expect(screen.getByRole('option', { name: /1번 테이블/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /2번 테이블/ })).toBeInTheDocument();
  });

  it('opens QR create and edit modals and deletes selected rows', async () => {
    const user = userEvent.setup();

    render(<QRCodeManagePage />);

    await user.click(screen.getByRole('button', { name: '신규' }));
    expect(screen.getByRole('dialog', { name: 'QR 코드 신규' })).toBeInTheDocument();
    expect(screen.getByLabelText('설명')).toHaveValue('신규 QR');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: 'QR-001 수정' }));
    expect(screen.getByRole('dialog', { name: 'QR 코드 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('홀 중앙 QR')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('checkbox', { name: 'QR-001 선택' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(screen.queryByText('홀 중앙 QR')).not.toBeInTheDocument();
  });

  it('filters QR rows by description or URL', async () => {
    const user = userEvent.setup();

    render(<QRCodeManagePage />);

    await user.type(screen.getByRole('textbox', { name: 'QR 코드 검색어' }), 'window');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('창가 2인석 QR')).toBeInTheDocument();
    expect(screen.queryByText('홀 중앙 QR')).not.toBeInTheDocument();
  });
});
