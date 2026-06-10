import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ClientSidebar } from './ClientSidebar';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderSidebar() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/client/main']}>
        <Routes>
          <Route
            path="/client/main"
            element={<ClientSidebar activeSection={null} onClose={vi.fn()} />}
          />
          <Route path="/client/login" element={<div>client login destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientSidebar', () => {
  it('logs out through auth mutation and moves to client login', async () => {
    const user = userEvent.setup();

    renderSidebar();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('client login destination')).toBeInTheDocument();
  });
});
