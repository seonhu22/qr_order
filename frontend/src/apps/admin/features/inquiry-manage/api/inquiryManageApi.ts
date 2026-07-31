import { useMutation } from '@tanstack/react-query';
import { useGetQna } from '@/generated/settings-controller/settings-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import type { CommonResponse } from '@/generated/types/commonResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { httpClient } from '@/shared/lib/httpClient';
import type { QnaRequest } from '@/generated/types/qnaRequest';
import type { QnaResponse } from '@/generated/types/qnaResponse';
import type { ServerFile } from '@/shared/components/file-attachment';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import {
  downloadAllServerFiles,
  downloadServerFile,
  mapFileResponseToServerFile,
} from '@/shared/utils/attachFile';
import type { InquiryManageRow, InquiryAnswerStatus } from '../types';

export { mapFileResponseToServerFile };

export type InquiryManageResponse = QnaResponse & {
  insertDatetime?: string;
};

export function mapToInquiryManageRow(res: InquiryManageResponse, index: number): InquiryManageRow {
  const answerStatus: InquiryAnswerStatus = res.answerYn === 'Y' ? 'answered' : 'pending';
  return {
    id: res.sysId ?? `inquiry-${index}`,
    sysId: res.sysId,
    fileUlid: res.fileUlid,
    title: res.qnaTitle ?? '-',
    content: res.qnaDescription ?? '-',
    plant: '-',
    registrant: res.writeUsername ?? '-',
    registeredAt: formatDateTimeForDisplay(res.insertDatetime) || '-',
    updatedAt: '-',
    answeredAt:
      answerStatus === 'answered' ? formatDateTimeForDisplay(res.answerDatetime) || '-' : '-',
    answerer: answerStatus === 'answered' ? (res.answerUserName ?? '-') : '-',
    answerStatus,
    answerContent: res.answerDescription ?? '',
  };
}

export function useInquiryManageQuery(searchKeyword = '') {
  return useGetQna(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.qna.list(searchKeyword),
      ...queryPolicies.adminCrudList,
    },
  });
}

/**
 * 현재 inquiry update API는 일반 수정 CRUD가 아니라 답변 등록/수정 용도다.
 * 백엔드가 실제로 사용하는 필드만 우선 조립한다.
 *
 * 답변 첨부파일은 FileRequest의 indexed field 계약을 확인한 뒤 같은 FormData에 추가한다.
 */
export function buildInquiryAnswerUpdateRequest(
  row: Pick<InquiryManageRow, 'sysId'>,
  answerDescription: string,
): QnaRequest {
  return {
    sysId: row.sysId,
    answerYn: 'Y',
    answerDescription,
  };
}

export function buildInquiryAnswerFormData(request: QnaRequest): FormData {
  const formData = new FormData();

  Object.entries(request).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value);
    }
  });

  return formData;
}

export function updateInquiryAnswer(request: QnaRequest, signal?: AbortSignal) {
  return httpClient<CommonResponse>({
    url: '/api/system/settings/board/qna/update',
    method: 'POST',
    data: buildInquiryAnswerFormData(request),
    signal,
  });
}

export function useInquiryAnswerMutation() {
  return useMutation({
    mutationFn: (request: QnaRequest) => updateInquiryAnswer(request),
  });
}

export function useInquiryAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile({ linkSysId: trimmed }, { query: { enabled: trimmed.length > 0 } });
}

export async function downloadInquiryFile(file: ServerFile): Promise<void> {
  await downloadServerFile(file);
}

export async function downloadAllInquiryFiles(fileUlid: string): Promise<void> {
  await downloadAllServerFiles(fileUlid);
}
