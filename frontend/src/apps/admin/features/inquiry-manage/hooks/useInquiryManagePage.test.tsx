import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInquiryManagePage } from './useInquiryManagePage';

const useInquiryManageQueryMock = vi.fn();
const useInquiryAnswerMutationMock = vi.fn();
const mapToInquiryManageRowMock = vi.fn();
const mutateAsyncMock = vi.fn();

vi.mock('../api/inquiryManageApi', () => ({
  useInquiryManageQuery: (...args: unknown[]) => useInquiryManageQueryMock(...args),
  useInquiryAnswerMutation: (...args: unknown[]) => useInquiryAnswerMutationMock(...args),
  mapToInquiryManageRow: (...args: unknown[]) => mapToInquiryManageRowMock(...args),
  buildInquiryAnswerUpdateRequest: (row: { sysId?: string }, answerDescription: string) => ({
    sysId: row.sysId,
    answerYn: 'Y',
    answerDescription,
  }),
}));

describe('useInquiryManagePage', () => {
  beforeEach(() => {
    useInquiryManageQueryMock.mockReset();
    useInquiryAnswerMutationMock.mockReset();
    mapToInquiryManageRowMock.mockReset();
    mutateAsyncMock.mockReset();

    useInquiryManageQueryMock.mockReturnValue({
      data: [
        {
          sysId: 'qna-1',
          qnaTitle: '문의 제목',
          qnaDescription: '문의 내용',
          answerYn: 'N',
          answerDescription: '',
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(async () => ({
        isError: false,
        error: null,
      })),
    });

    useInquiryAnswerMutationMock.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    });

    mapToInquiryManageRowMock.mockReturnValue({
      id: 'qna-1',
      sysId: 'qna-1',
      title: '문의 제목',
      content: '문의 내용',
      plant: '-',
      registrant: '-',
      registeredAt: '2026-04-30',
      updatedAt: '-',
      answeredAt: '-',
      answerStatus: 'pending',
      answerContent: '',
    });
  });

  it('maps query rows for table rendering', () => {
    const { result } = renderHook(() => useInquiryManagePage());

    expect(result.current.data.rows).toEqual([
      {
        id: 'qna-1',
        sysId: 'qna-1',
        title: '문의 제목',
        content: '문의 내용',
        plant: '-',
        registrant: '-',
        registeredAt: '2026-04-30',
        updatedAt: '-',
        answeredAt: '-',
        answerStatus: 'pending',
        answerContent: '',
      },
    ]);
  });

  it('saves answer then refetches inquiry list', async () => {
    const refetchMock = vi.fn(async () => ({
      isError: false,
      error: null,
    }));

    useInquiryManageQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: refetchMock,
    });

    const { result } = renderHook(() => useInquiryManagePage());

    await act(async () => {
      await result.current.actions.saveAnswer(
        {
          id: 'qna-1',
          sysId: 'qna-1',
          title: '문의 제목',
          content: '문의 내용',
          plant: '-',
          registrant: '-',
          registeredAt: '2026-04-30',
          updatedAt: '-',
          answeredAt: '-',
          answerStatus: 'pending',
          answerContent: '',
        },
        '답변 완료',
      );
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      data: {
        sysId: 'qna-1',
        answerYn: 'Y',
        answerDescription: '답변 완료',
      },
    });
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when sysId is missing before answer save', async () => {
    const { result } = renderHook(() => useInquiryManagePage());

    await expect(
      result.current.actions.saveAnswer(
        {
          id: 'fallback-id',
          title: '문의 제목',
          content: '문의 내용',
          plant: '-',
          registrant: '-',
          registeredAt: '2026-04-30',
          updatedAt: '-',
          answeredAt: '-',
          answerStatus: 'pending',
          answerContent: '',
        },
        '답변 완료',
      ),
    ).rejects.toThrow('문의사항 조회 응답에 sysId가 없어 답변을 저장할 수 없습니다.');
  });
});
