import { useMutation } from '@tanstack/react-query';
import { useGetQna1 } from '@/generated/board-controller/board-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import {
  downloadAllServerFiles,
  downloadServerFile,
  mapFileResponseToServerFile,
} from '@/shared/utils/attachFile';
import type { ClientQnaResponse } from '@/generated/types/clientQnaResponse';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { FileChangeState } from '@/shared/components/file-attachment';
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
  fileChangeState?: FileChangeState;
};

function getDefaultFilePath(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `/${y}/${m}`;
}

export function buildCreateInquiryFormData(payload: CreateInquiryPayload): FormData {
  const formData = new FormData();
  const newFiles = payload.fileChangeState?.newFiles ?? [];
  const filePath = getDefaultFilePath();

  formData.append('qnaTitle', payload.title);
  formData.append('qnaDescription', payload.content);

  newFiles.forEach((file, i) => {
    formData.append(`newItems[${i}].file`, file);
    formData.append(`newItems[${i}].convertFileNm`, crypto.randomUUID());
    formData.append(`newItems[${i}].filePath`, filePath);
    formData.append(`newItems[${i}].ordNo`, String(i + 1));
  });

  return formData;
}

async function readCreateInquiryError(response: Response): Promise<string> {
  const text = await response.text();

  if (!text.trim()) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = typeof payload.message === 'string' ? payload.message : payload.error;
    return typeof message === 'string' && message.trim()
      ? message
      : `${response.status} ${response.statusText}`;
  } catch {
    return text;
  }
}

export async function postCreateInquiryFormData(payload: CreateInquiryPayload): Promise<CommonResponse> {
  const response = await fetch('/api/client/board/qna/new', {
    method: 'POST',
    body: buildCreateInquiryFormData(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readCreateInquiryError(response));
  }

  const text = await response.text();
  return text.trim() ? JSON.parse(text) as CommonResponse : { success: true };
}

export function useCreateInquiryMutation() {
  return useMutation({
    mutationFn: ({ data }: { data: CreateInquiryPayload }) => postCreateInquiryFormData(data),
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
