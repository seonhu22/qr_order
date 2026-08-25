import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { ConsumerHeader } from './ConsumerHeader';

beforeEach(() => {
  useConsumerOrderFilterStore.setState({ searchQuery: '', selectedCategory: '전체' });
});

describe('ConsumerHeader', () => {
  it('검색어를 API 최대 길이인 100자로 제한한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ConsumerHeader />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const input = screen.getByRole('textbox', { name: '메뉴 검색' });

    await userEvent.click(input);
    await userEvent.paste('가'.repeat(101));

    expect(input).toHaveValue('가'.repeat(100));
  });
});
