import { useGetNotice } from '@/generated/settings-controller/settings-controller';
import {
  useGetAttachFile,
  downloadFile,
  downloadAllFile,
} from '@/generated/file-controller/file-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { formatDateTimeForDisplay } from '@/shared/utils/dateTimeDisplay';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
import type { NoticeResponse } from '@/generated/types/noticeResponse';
import type { ServerFile } from '@/shared/components/file-attachment';
import type { NoticeListRow } from '../types';

export { mapFileResponseToServerFile };

type NoticeResponseWithMeta = NoticeResponse & {
  sysId?: string;
  insertUserId?: string;
  insertUserNm?: string;
  insertDatetime?: string;
};

export function mapToNoticeListRow(res: NoticeResponseWithMeta, index: number): NoticeListRow {
  return {
    id: res.sysId || `notice-${index}`,
    title: res.noticeTitle ?? '-',
    content: res.noticeDescription ?? '-',
    registrant: res.insertUserNm ?? '-',
    registeredAt: formatDateTimeForDisplay(res.insertDatetime).slice(0, 16) || '-',
    fileUlid: res.fileUlid,
  };
}

export function useNoticeListQuery(searchKeyword?: string) {
  const params = searchKeyword ? { searchKeyword } : {};
  return useGetNotice(params, {
    query: {
      queryKey: queryKeys.notice.list(searchKeyword ?? ''),
      ...queryPolicies.clientReferenceData,
    },
  });
}

export function useNoticeAttachFileQuery(fileUlid: string | undefined) {
  const trimmed = fileUlid?.trim() ?? '';
  return useGetAttachFile({ linkSysId: trimmed }, { query: { enabled: trimmed.length > 0 } });
}

export async function downloadNoticeFile(file: ServerFile): Promise<void> {
  const blob = await downloadFile({ sysId: file.sysId });
  triggerBlobDownload(blob, file.originalFileNm);
}

export async function downloadAllNoticeFiles(fileUlid: string): Promise<void> {
  const blob = await downloadAllFile({ linkSysId: fileUlid });
  triggerBlobDownload(blob, 'files.zip');
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
