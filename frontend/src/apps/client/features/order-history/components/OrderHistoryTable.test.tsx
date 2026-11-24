import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderHistoryTable } from './OrderHistoryTable';

describe('OrderHistoryTable', () => {
  it('주문 행의 메뉴명 아래에 해당 메뉴의 옵션 문구를 표시한다', () => {
    const rows = [{
      id: 'master-1',
      orderNo: '2',
      tableNum: '1',
      orderStatus: 'RECEIVED' as const,
      paymentStatus: 'UNPAID' as const,
      orderDatetime: '2026-08-06T14:25:00',
      details: [
        { id: 'detail-1', menuName: '쌀국수', menuOption: '- 치즈 추가500\n- 매운 소스0' },
        { id: 'detail-2', menuName: '반미', menuOption: '' },
      ],
    }];

    render(<OrderHistoryTable rows={rows} isLoading={false} isError={false} emptyMessage="내역 없음" />);

    const row = screen.getByRole('cell', { name: '2' }).closest('tr')!;
    const [menu, menuWithoutOptions] = within(row).getAllByRole('listitem');
    expect(within(menu).getByText('쌀국수')).toBeInTheDocument();
    expect(within(menu).getByText('- 치즈 추가500 - 매운 소스0')).toHaveTextContent(
      '- 치즈 추가500\n- 매운 소스0',
      { normalizeWhitespace: false },
    );
    expect(menuWithoutOptions).toHaveTextContent(/^반미$/);
  });
});
