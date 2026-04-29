import { useMemo } from 'react';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import {
  buildInquiryAnswerUpdateRequest,
  mapToInquiryManageRow,
  useInquiryAnswerMutation,
  useInquiryManageQuery,
} from '../api/inquiryManageApi';
import type { InquiryManageRow } from '../types';

async function refetchOrThrow<TError>(
  refetch: () => Promise<{ isError: boolean; error: TError | null }>,
  errorMessage: string,
) {
  const result = await refetch();

  if (result.isError) {
    throw result.error instanceof Error ? result.error : new Error(errorMessage);
  }
}

export function useInquiryManagePage() {
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');

  const query = useInquiryManageQuery(appliedKeyword.trim());
  const updateMutation = useInquiryAnswerMutation();

  const rows = useMemo(() => (query.data ?? []).map(mapToInquiryManageRow), [query.data]);

  const saveAnswer = async (row: InquiryManageRow, answerDescription: string) => {
    if (!row.sysId) {
      throw new Error(
        '문의사항 조회 응답에 sysId가 없어 답변을 저장할 수 없습니다. 백엔드 응답 계약 확인이 필요합니다.',
      );
    }

    const request = buildInquiryAnswerUpdateRequest(row, answerDescription.trim());

    await updateMutation.mutateAsync({ data: request });
    await refetchOrThrow(query.refetch, '답변 저장 후 문의사항 목록을 다시 조회하지 못했습니다.');
  };

  return {
    data: { rows },
    status: {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      isSaving: updateMutation.isPending,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch: applyDraftKeyword,
      handleReset: resetKeywords,
      saveAnswer,
    },
    uiProps: { draftKeyword },
  };
}
