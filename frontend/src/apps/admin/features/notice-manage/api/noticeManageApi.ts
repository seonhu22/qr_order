import {
  useGetNotice,
  useDelNotice,
} from '@/generated/settings-controller/settings-controller';
import { useGetAttachFile } from '@/generated/file-controller/file-controller';
import { useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
import type { NoticeResponse } from '@/generated/types/noticeResponse';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { FileChangeState } from '@/shared/components/file-attachment';
import type { NoticeManageRow } from '../types';

export { mapFileResponseToServerFile };

type NoticeResponseWithMeta = NoticeResponse & {
  sysId?: string;
  insertUserId?: string;
  insertDatetime?: string;
  modifyDatetime?: string;
};

export function mapToNoticeManageRow(res: NoticeResponseWithMeta, index: number): NoticeManageRow {
  const sysId = res.sysId ?? '';

  return {
    id: sysId || `notice-${index}-${res.noticeTitle ?? ''}-${res.startDate ?? ''}`,
    sysId,
    fileUlid: res.fileUlid,
    useYn: res.useYn ?? 'Y',
    noticeType: 'notice',
    target: 'all',
    title: res.noticeTitle ?? '',
    content: res.noticeDescription ?? '',
    registrant: res.insertUserId ?? '',
    registeredAt: res.insertDatetime ?? res.startDate ?? '',
    updatedAt: formatDateTimeForDisplay(res.modifyDatetime),
  };
}

export function useNoticeManageQuery(searchKeyword?: string) {
  const params = searchKeyword ? { searchKeyword } : {};
  return useGetNotice(params, {
    query: {
      queryKey: queryKeys.notice.list(searchKeyword ?? ''),
    },
  });
}

export type SaveNoticeFormDataPayload = {
  sysId?: string;
  fileUlid?: string;
  useYn?: string;
  title: string;
  content: string;
  fileChangeState?: FileChangeState;
};

function formatNoticeStartDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} 00:00:00`;
}

function getDefaultFilePath(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `/${y}/${m}`;
}

function appendNoticeFields(formData: FormData, payload: SaveNoticeFormDataPayload) {
  if (payload.sysId) {
    formData.append('sysId', payload.sysId);
  }

  if (payload.sysId && payload.fileUlid) {
    formData.append('fileUuid', payload.fileUlid);
  }

  formData.append('noticeTitle', payload.title);
  formData.append('noticeDescription', payload.content);
  formData.append('startDate', formatNoticeStartDate());
  formData.append('useYn', payload.useYn ?? 'Y');
}

function appendFileFields(formData: FormData, payload: SaveNoticeFormDataPayload) {
  const fileChangeState = payload.fileChangeState ?? { newFiles: [], deletedFiles: [] };
  const filePath = getDefaultFilePath();
  const linkSysId = payload.fileUlid || payload.sysId;

  fileChangeState.newFiles.forEach((file, i) => {
    formData.append(`newItems[${i}].file`, file);
    if (linkSysId) {
      formData.append(`newItems[${i}].linkSysId`, linkSysId);
    }
    formData.append(`newItems[${i}].convertFileNm`, crypto.randomUUID());
    formData.append(`newItems[${i}].filePath`, filePath);
    formData.append(`newItems[${i}].ordNo`, String(i + 1));
  });

  fileChangeState.deletedFiles.forEach((file, i) => {
    formData.append(`delItems[${i}].sysId`, file.sysId);
  });
}

export function buildNoticeFormData(payload: SaveNoticeFormDataPayload): FormData {
  const formData = new FormData();
  appendNoticeFields(formData, payload);
  appendFileFields(formData, payload);
  return formData;
}

async function readNoticeError(response: Response): Promise<string> {
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

async function postNoticeFormData(url: string, payload: SaveNoticeFormDataPayload): Promise<CommonResponse> {
  const response = await fetch(url, {
    method: 'POST',
    body: buildNoticeFormData(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readNoticeError(response));
  }

  const text = await response.text();
  return text.trim() ? JSON.parse(text) as CommonResponse : { success: true };
}

export function useCreateNoticeMutation() {
  return useMutation({
    mutationFn: ({ data }: { data: SaveNoticeFormDataPayload }) =>
      postNoticeFormData('/api/system/settings/board/notice/new', data),
  });
}

export function useUpdateNoticeMutation() {
  return useMutation({
    mutationFn: ({ data }: { data: SaveNoticeFormDataPayload }) =>
      postNoticeFormData('/api/system/settings/board/notice/update', data),
  });
}

export function useDeleteNoticesMutation() {
  return useDelNotice();
}

export function useNoticeAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile(
    { linkSysId: trimmed },
    { query: { enabled: trimmed.length > 0 } },
  );
}
