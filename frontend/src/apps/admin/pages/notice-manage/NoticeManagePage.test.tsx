import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { NoticeManagePage } from './NoticeManagePage';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <NoticeManagePage />
    </QueryClientProvider>,
  );
}

describe('NoticeManagePage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/system/settings/board/notice/search', () =>
        HttpResponse.json([
          {
            noticeTitle: '점검 공지',
            noticeDescription: '시스템 점검 안내',
            startDate: '2026-04-29',
          },
        ]),
      ),
    );
  });

  it('renders notice rows from the search API', async () => {
    renderPage();

    expect(await screen.findByText('점검 공지')).toBeInTheDocument();
    expect(screen.getByText('시스템 점검 안내')).toBeInTheDocument();
  });

  it('shows an error notice when editing a row without sysId from the search response', async () => {
    renderPage();

    await screen.findByText('점검 공지');
    const [allCheckbox, rowCheckbox] = screen.getAllByRole('checkbox');
    expect(screen.getByRole('button', { name: '점검 공지 수정' })).toBeDisabled();
    expect(rowCheckbox).toBeDisabled();
    expect(allCheckbox).toBeDisabled();
  });

  it('shows an error notice when sysId is missing and save is attempted through page state', async () => {
    server.use(
      http.get('/api/system/settings/board/notice/search', () =>
        HttpResponse.json([
          {
            sysId: 'notice-1',
            noticeTitle: '정상 공지',
            noticeDescription: '정상 데이터',
            startDate: '2026-04-29',
          },
          {
            noticeTitle: '점검 공지',
            noticeDescription: '시스템 점검 안내',
            startDate: '2026-04-29',
          },
        ]),
      ),
    );

    renderPage();

    await screen.findByText('정상 공지');
    expect(screen.getByRole('button', { name: '점검 공지 수정' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '정상 공지 수정' }));
    expect(screen.getByRole('dialog', { name: '공지사항 수정' })).toBeInTheDocument();
  });
});
