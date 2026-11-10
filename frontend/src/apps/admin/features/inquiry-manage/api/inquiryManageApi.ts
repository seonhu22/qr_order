import { useMutation } from '@tanstack/react-query';
import { useGetQna } from '@/generated/settings-controller/settings-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import type { CommonResponse } from '@/generated/types/commonResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { httpClient } from '@/shared/lib/httpClient';
import type { QnaRequest } from '@/generated/types/qnaRequest';
import type { QnaResponse } from '@/generated/types/qnaResponse';
import type { FileChangeState, ServerFile } from '@/shared/components/file-attachment';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import {
  downloadAllServerFiles,
  buildAttachFileSaveFormData,
  downloadServerFile,
  mapFileResponseToServerFile,
} from '@/shared/utils/attachFile';
import type { InquiryManageRow, InquiryAnswerStatus } from '../types';

export { mapFileResponseToServerFile };

export function mapToInquiryManageRow(res: QnaResponse, index: number): InquiryManageRow {
  const answerStatus: InquiryAnswerStatus = res.answerYn === 'Y' ? 'answered' : 'pending';
  return {
    id: res.sysId ?? `inquiry-${index}`,
    sysId: res.sysId,
    fileUlid: res.fileUlid,
    title: res.qnaTitle ?? '-',
    content: res.qnaDescription ?? '-',
    plant: '-',
    registrant: res.writeUsername ?? '-',
    registeredAt: formatDateTimeForDisplay(res.writeDatetime) || '-',
    updatedAt: formatDateTimeForDisplay(res.modifyDatetime) || '-',
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
 * 답변 파일은 문의 sysId로 연결하고 원문 첨부 fileUlid와 분리한다.
 */
export function buildInquiryAnswerUpdateRequest(
  row: Pick<InquiryManageRow, 'sysId'>,
  answerDescription: string,
  fileChangeState?: FileChangeState,
): InquiryAnswerRequest {
  return {
    sysId: row.sysId,
    answerYn: 'Y',
    answerDescription,
    ...(fileChangeState ? { fileChangeState } : {}),
  };
}

export type InquiryAnswerRequest = QnaRequest & { fileChangeState?: FileChangeState };

export function buildInquiryAnswerFormData(request: InquiryAnswerRequest): FormData {
  const { fileChangeState, ...answerFields } = request;
  if (fileChangeState?.deletedFiles.length) {
    throw new Error('기존 답변 첨부파일 삭제는 아직 지원하지 않습니다.');
  }
  if (fileChangeState?.newFiles.length && !request.sysId?.trim()) {
    throw new Error('문의 식별자가 없어 답변 첨부파일을 저장할 수 없습니다.');
  }
  const formData = fileChangeState
    ? buildAttachFileSaveFormData(request.sysId ?? '', fileChangeState)
    : new FormData();

  Object.entries(answerFields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value);
    }
  });

  return formData;
}

export async function updateInquiryAnswer(request: InquiryAnswerRequest, signal?: AbortSignal) {
  return httpClient<CommonResponse>({
    url: '/api/system/settings/board/qna/update',
    method: 'POST',
    data: buildInquiryAnswerFormData(request),
    signal,
  });
}

export function useInquiryAnswerMutation() {
  return useMutation({
    mutationFn: (request: InquiryAnswerRequest) => updateInquiryAnswer(request),
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
