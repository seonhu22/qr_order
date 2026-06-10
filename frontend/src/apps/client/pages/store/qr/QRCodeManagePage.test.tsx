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

  it('filters QR rows by description or URL', async () => {
    const user = userEvent.setup();

    render(<QRCodeManagePage />);

    await user.type(screen.getByRole('textbox', { name: 'QR 코드 검색어' }), 'window');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(screen.getByText('창가 2인석 QR')).toBeInTheDocument();
    expect(screen.queryByText('홀 중앙 QR')).not.toBeInTheDocument();
  });
});
