import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { useInquiryListPage } from './useInquiryListPage';

describe('useInquiryListPage', () => {
  it('문의 원문과 답변 첨부파일을 각각의 연결 ID로 조회하고 구분한다', async () => {
    const requestedLinkIds: string[] = [];
    server.use(
      http.get('*/api/client/board/qna/search', () => HttpResponse.json([
        {
          sysId: 'qna-1',
          qnaTitle: '문의 제목',
          qnaDescription: '문의 내용',
          fileUlid: 'original-files',
          answerYn: 'Y',
          answerDescription: '답변 내용',
        },
      ])),
      http.get('*/api/attach_file', ({ request }) => {
        const linkSysId = new URL(request.url).searchParams.get('linkSysId') ?? '';
        requestedLinkIds.push(linkSysId);
        if (linkSysId === 'original-files') {
          return HttpResponse.json([{ sysId: 'original-file', originalFileNm: '문의.txt' }]);
        }
        if (linkSysId === 'qna-1') {
          return HttpResponse.json([{ sysId: 'answer-file', originalFileNm: '답변.txt' }]);
        }
        return HttpResponse.json([], { status: 400 });
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => useInquiryListPage(), { wrapper });

    await waitFor(() => expect(result.current.data.rows).toHaveLength(1));
    expect(requestedLinkIds).toEqual([]);

    act(() => result.current.actions.handleRowClick(result.current.data.rows[0]));

    await waitFor(() => {
      expect(result.current.uiProps.attachFiles).toEqual([
        expect.objectContaining({ sysId: 'original-file', originalFileNm: '문의.txt' }),
      ]);
      expect(result.current.uiProps.answerFiles).toEqual([
        expect.objectContaining({ sysId: 'answer-file', originalFileNm: '답변.txt' }),
      ]);
    });
    expect(requestedLinkIds).toHaveLength(2);
    expect(requestedLinkIds).toEqual(expect.arrayContaining(['original-files', 'qna-1']));
    expect(result.current.uiProps.answerFilesError).toBe(false);

    unmount();
    queryClient.clear();
  });
});
