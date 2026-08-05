import { useGetQna, useUpdateQna } from '@/generated/settings-controller/settings-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
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
 * TODO: 답변 첨부파일 — /api/system/settings/board/qna/update는 순수 JSON(QnaRequest)이고
 * 파일 바이너리를 실어 보낼 파라미터가 없다(client board-controller의 qna/new와 동일한 문제).
 * InquiryManagePage.tsx의 FileInputGroup은 선택·검증까지만 동작하며, 실제 업로드·연결은
 * 백엔드 계약(별도 업로드 엔드포인트 여부, sysId 연결 시점 등) 확인 후 이 함수에 반영한다.
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

export function useInquiryAnswerMutation() {
  return useUpdateQna();
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
