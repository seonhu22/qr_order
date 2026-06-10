import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
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
      <MemoryRouter initialEntries={['/admin/system/notice']}>
        <NoticeManagePage />
      </MemoryRouter>
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

  it('allows selecting and entering edit mode even when sysId is missing from the search response', async () => {
    renderPage();

    await screen.findByText('점검 공지');
    const [allCheckbox, rowCheckbox] = screen.getAllByRole('checkbox');
    const editButton = screen.getByRole('button', { name: '점검 공지 수정' });

    expect(editButton).toBeEnabled();
    expect(rowCheckbox).toBeEnabled();
    expect(allCheckbox).toBeEnabled();

    fireEvent.click(rowCheckbox);
    expect(rowCheckbox).toBeChecked();

    fireEvent.click(editButton);
    expect(screen.getByRole('dialog', { name: '공지사항 수정' })).toBeInTheDocument();
  });

  it('sends update API even when sysId is missing during QA', async () => {
    let receivedFormData: FormData | null = null;

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
      http.post('/api/system/settings/board/notice/update', async ({ request }) => {
        receivedFormData = await request.formData();
        return HttpResponse.json({ success: true, data: null, message: 'OK' });
      }),
    );

    renderPage();

    await screen.findByText('정상 공지');
    expect(screen.getByRole('button', { name: '점검 공지 수정' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: '점검 공지 수정' }));
    expect(screen.getByRole('dialog', { name: '공지사항 수정' })).toBeInTheDocument();

    await userEvent.type(screen.getByDisplayValue('점검 공지'), ' 수정');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    const saveConfirmDialog = await screen.findByRole('dialog', {
      name: '수정된 내용을 저장하시겠습니까?',
    });
    fireEvent.click(within(saveConfirmDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByText('저장되었습니다.')).toBeInTheDocument();
    expect((receivedFormData as FormData | null)?.get('noticeTitle')).toBe('점검 공지 수정');
    expect((receivedFormData as FormData | null)?.has('sysId')).toBe(false);
  });
});
