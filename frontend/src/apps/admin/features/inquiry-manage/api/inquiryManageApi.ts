import { useGetQna } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import type { QnaResponse } from '@/generated/types/qnaResponse';
import type { DateTime } from '@/generated/types/dateTime';
import type { InquiryManageRow, InquiryAnswerStatus } from '../types';

function formatDateTime(dt?: DateTime): string {
  if (!dt?.Year) return '-';
  const y = dt.Year;
  const m = String(dt.Month ?? 1).padStart(2, '0');
  const d = String(dt.Day ?? 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function mapToInquiryManageRow(res: QnaResponse, index: number): InquiryManageRow {
  const answerStatus: InquiryAnswerStatus = res.answerYn === 'Y' ? 'answered' : 'pending';
  return {
    id: res.sysId ?? `inquiry-${index}`,
    title: res.qnaTitle ?? '-',
    content: res.qnaDescription ?? '-',
    plant: '-',
    registrant: '-',
    registeredAt: formatDateTime(res.startDate),
    updatedAt: '-',
    answeredAt: answerStatus === 'answered' ? formatDateTime(res.answerDatetime) : '-',
    answerStatus,
    answerContent: res.answerDescription ?? '',
  };
}

export function useInquiryManageQuery(searchKeyword = '') {
  return useGetQna(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.qna.list(searchKeyword),
      },
    },
  );
}