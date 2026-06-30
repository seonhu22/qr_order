import { useGetQna1, useNewQna } from '@/generated/board-controller/board-controller';
import {
  useGetAttachFile,
  downloadFile,
  downloadAllFile,
} from '@/generated/file-controller/file-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
import { triggerBlobDownload } from '@/shared/utils/downloadBlob';
import type { ClientQnaRequest } from '@/generated/types/clientQnaRequest';
import type { ClientQnaResponse } from '@/generated/types/clientQnaResponse';
import type { ServerFile } from '@/shared/components/file-attachment';
import type { InquiryListRow } from '../types';

export { mapFileResponseToServerFile };

export function mapToInquiryListRow(res: ClientQnaResponse, index: number): InquiryListRow {
  const isAnswered = res.answerYn === 'Y';

  return {
    id: res.sysId || `inquiry-${index}`,
    sysId: res.sysId ?? '',
    title: res.qnaTitle ?? '-',
    content: res.qnaDescription ?? '-',
    registrant: res.writeUserName ?? '-',
    registeredAt: formatDateTimeForDisplay(res.writeDatetime).slice(0, 16) || '-',
    answerStatus: isAnswered ? 'answered' : 'pending',
    answeredAt: isAnswered ? formatDateTimeForDisplay(res.answerDatetime).slice(0, 16) || '-' : '-',
    answerContent: isAnswered ? res.answerDescription ?? '' : '',
    fileUlid: res.fileUlid,
  };
}

export function useInquiryListQuery(searchKeyword?: string) {
  const params = searchKeyword ? { searchKeyword } : {};
  return useGetQna1(params, {
    query: {
      queryKey: queryKeys.clientInquiry.list(searchKeyword ?? ''),
      ...queryPolicies.clientReferenceData,
    },
  });
}

export type CreateInquiryPayload = {
  title: string;
  content: string;
};

/**
 * 첨부파일은 모달 레이아웃에만 반영하고 실제 업로드는 아직 연동하지 않는다.
 * openapi.json상 POST /api/client/board/qna/new은 순수 JSON(ClientQnaRequest)이고
 * 파일 업로드 파라미터가 없어, 파일을 신청서와 함께 묶어 보내는 방식인지
 * 별도로 /api/attach_file/save를 호출해 sysId로 연결하는 방식인지 백엔드 확인이 필요하다.
 */
export function buildCreateInquiryRequest(payload: CreateInquiryPayload): ClientQnaRequest {
  return {
    qnaTitle: payload.title,
    qnaDescription: payload.content,
  };
}

export function useCreateInquiryMutation() {
  return useNewQna();
}

export function useInquiryAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile({ linkSysId: trimmed }, { query: { enabled: trimmed.length > 0 } });
}

export async function downloadInquiryFile(file: ServerFile): Promise<void> {
  const blob = await downloadFile({ sysId: file.sysId });
  triggerBlobDownload(blob, file.originalFileNm);
}

export async function downloadAllInquiryFiles(fileUlid: string): Promise<void> {
  const blob = await downloadAllFile({ linkSysId: fileUlid });
  triggerBlobDownload(blob, 'files.zip');
}
