import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TableInfoPage } from './TableInfoPage';

beforeEach(async () => {
  await fetch('/api/test/table-info/reset', { method: 'POST' });
});

function renderTableInfoPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TableInfoPage />
    </QueryClientProvider>,
  );
}

describe('TableInfoPage', () => {
  it('renders table rows from the mock server', async () => {
    renderTableInfoPage();

    expect(await screen.findByDisplayValue('테이블 1번')).toBeInTheDocument();
    expect(screen.getByDisplayValue('단체석 3번')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '미사용' })).toBeInTheDocument();
  });

  it('saves edited table rows through the mock server', async () => {
    const user = userEvent.setup();
    renderTableInfoPage();

    const tableNameInput = await screen.findByDisplayValue('테이블 1번');

    await user.clear(tableNameInput);
    await user.type(tableNameInput, '창가 테이블');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장되었습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('창가 테이블')).toBeInTheDocument();
    });
  });
});
