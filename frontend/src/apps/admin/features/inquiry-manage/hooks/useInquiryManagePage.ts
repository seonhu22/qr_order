import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import {
  buildInquiryAnswerUpdateRequest,
  mapToInquiryManageRow,
  useInquiryAnswerMutation,
  useInquiryManageQuery,
} from '../api/inquiryManageApi';
import type { InquiryManageRow } from '../types';

export function useInquiryManagePage() {
  const queryClient = useQueryClient();
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.qna.lists });
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
