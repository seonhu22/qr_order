import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInquiryManagePage } from './useInquiryManagePage';

const useInquiryManageQueryMock = vi.fn();
const useInquiryAnswerMutationMock = vi.fn();
const mapToInquiryManageRowMock = vi.fn();
const mutateAsyncMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

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
    invalidateQueriesMock.mockReset();

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
      answerer: '-',
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
        answerer: '-',
        answerStatus: 'pending',
        answerContent: '',
      },
    ]);
  });

  it('saves answer then invalidates inquiry list cache', async () => {
    useInquiryManageQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
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
          answerer: '-',
          answerStatus: 'pending',
          answerContent: '',
        },
        '답변 완료',
      );
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      sysId: 'qna-1',
      answerYn: 'Y',
      answerDescription: '답변 완료',
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['board', 'qna', 'list'],
    });
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
          answerer: '-',
          answerStatus: 'pending',
          answerContent: '',
        },
        '답변 완료',
      ),
    ).rejects.toThrow('문의사항 조회 응답에 sysId가 없어 답변을 저장할 수 없습니다.');
  });
});
