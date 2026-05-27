import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { AdminForbiddenPage } from './AdminForbiddenPage';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/admin/forbidden']}>
        <Routes>
          <Route path="/admin/forbidden" element={<AdminForbiddenPage />} />
          <Route path="/admin/login" element={<div>login destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminForbiddenPage', () => {
  it('logs out and moves to login page', async () => {
    server.use(
      http.post('/api/auth/logout', () => HttpResponse.json({ success: true })),
    );

    renderPage();

    expect(screen.getByRole('heading', { name: '접근 권한이 없습니다.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByText('login destination')).toBeInTheDocument();
  });
});
