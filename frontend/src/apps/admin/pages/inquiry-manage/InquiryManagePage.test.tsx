import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { InquiryManagePage } from './InquiryManagePage';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><InquiryManagePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

function installHandlers(failSave = false) {
  const requestedLinks: string[] = [];
  const savedForms: FormData[] = [];
  let saved = false;
  // jsdom File은 Node fetch의 multipart 인코더와 호환되지 않는다.
  // 화면→실제 API 매퍼→fetch 경계의 FormData를 검사하고 GET은 MSW로 전달한다.
  const originalFetch = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
    if (input === '/api/system/settings/board/qna/update' && options?.method === 'POST') {
      savedForms.push(options.body as FormData);
      if (failSave) return HttpResponse.json({ success: false, message: '저장 실패' }, { status: 500 });
      saved = true;
      return HttpResponse.json({ success: true });
    }
    return originalFetch(input, options);
  });
  server.use(
    http.get('/api/system/settings/menu/search', () => HttpResponse.json([])),
    http.get('/api/system/settings/board/qna/search', () => HttpResponse.json([{
      sysId: 'qna-1', fileUlid: 'original-files', qnaTitle: '결제 문의',
      qnaDescription: '결제 확인 부탁드립니다.', answerYn: saved ? 'Y' : 'N',
      answerDescription: saved ? '확인했습니다.' : '',
    }])),
    http.get('/api/attach_file', ({ request }) => {
      const link = new URL(request.url).searchParams.get('linkSysId') ?? '';
      requestedLinks.push(link);
      return HttpResponse.json(link === 'qna-1' && saved ? [{
        sysId: 'answer-file', originalFileNm: 'answer', fileExt: '.png', fileSize: '0.01',
      }] : []);
    }),
  );
  return { requestedLinks, savedForms };
}

async function prepareAnswer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '결제 문의 상세 보기' }));
  const dialog = screen.getByRole('dialog', { name: '문의사항 상세' });
  await user.type(within(dialog).getByPlaceholderText('답변 내용을 입력하세요'), '확인했습니다.');
  const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, {
    target: { files: [new File(['answer-content'], 'answer.png', { type: 'image/png' })] },
  });
  return dialog;
}

describe('InquiryManagePage answer attachments', () => {
  afterEach(() => vi.restoreAllMocks());
  it('posts the selected answer file and reloads answer files separately from original attachments', async () => {
    const state = installHandlers();
    const user = userEvent.setup();
    renderPage();
    const dialog = await prepareAnswer(user);
    await user.click(within(dialog).getByRole('button', { name: '확인' }));
    await waitFor(() => {
      const error = screen.queryByRole('dialog', { name: '오류' });
      if (error) throw new Error(error.textContent ?? 'unknown save error');
      expect(state.savedForms).toHaveLength(1);
    });
    await screen.findByText('답변이 저장되었습니다.');

    const form = state.savedForms[0];
    expect(form.get('sysId')).toBe('qna-1');
    expect(form.get('answerDescription')).toBe('확인했습니다.');
    expect(form.get('newItems[0].linkSysId')).toBe('qna-1');
    const file = form.get('newItems[0].file') as File;
    expect(file.name).toBe('answer.png');
    expect(file.size).toBe('answer-content'.length);
    expect([...form.keys()].some((key) => key.startsWith('delItems'))).toBe(false);
    const answerReads = state.requestedLinks.filter((link) => link === 'qna-1').length;
    const notice = screen.getByRole('dialog', { name: '안내' });
    await user.click(within(notice).getByRole('button', { name: '확인' }));
    await user.click(screen.getByRole('button', { name: '결제 문의 상세 보기' }));
    await screen.findByRole('button', { name: 'answer 다운로드' });
    expect(state.requestedLinks).toContain('original-files');
    await waitFor(() => expect(state.requestedLinks.filter((link) => link === 'qna-1').length)
      .toBeGreaterThan(answerReads));
  });

  it('keeps the answer text and selected file when saving fails', async () => {
    const state = installHandlers(true);
    const user = userEvent.setup();
    renderPage();
    const dialog = await prepareAnswer(user);
    await user.click(within(dialog).getByRole('button', { name: '확인' }));
    await screen.findByRole('dialog', { name: '오류' });
    expect(within(dialog).getByPlaceholderText('답변 내용을 입력하세요')).toHaveValue('확인했습니다.');
    expect(within(dialog).getByText('answer.png')).toBeInTheDocument();
    expect(state.savedForms[0].get('newItems[0].file')).not.toBeNull();
  });
});
