import type { FileResponse } from '@/generated/types/fileResponse';
import type { ServerFile } from '@/shared/components/file-attachment';
import { downloadAllFile, downloadFile } from '@/generated/file-controller/file-controller';
import { triggerBlobDownload } from './downloadBlob';

/**
 * BE FileResponse → FileInputGroup/FileDownloadList 가 쓰는 ServerFile 로 변환.
 * BE 응답에 convertFileNm 이 없으므로 sysId 를 식별키로 채운다
 * (FileInputGroup 이 convertFileNm 으로 개별 삭제를 판별 — 다수 파일 안전성).
 */
export function mapFileResponseToServerFile(f: FileResponse): ServerFile {
  return {
    sysId: f.sysId ?? '',
    linkSysId: '',
    originalFileNm: f.originalFileNm ?? '',
    convertFileNm: f.sysId ?? '',
    fileExt: f.fileExt ?? '',
    mimeType: '',
    fileSize: f.fileSize ?? '0',
    filePath: f.filePath ?? '',
    ordNo: f.ordNo ?? 0,
    pdfYn: f.pdfYn ?? 'N',
  };
}

export async function downloadServerFile(file: ServerFile): Promise<void> {
  const blob = await downloadFile({ sysId: file.sysId });
  triggerBlobDownload(blob, file.originalFileNm);
}

export async function downloadAllServerFiles(linkSysId: string, filename = 'files.zip'): Promise<void> {
  const blob = await downloadAllFile({ linkSysId });
  triggerBlobDownload(blob, filename);
}

export function getDefaultAttachFilePath(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `/${year}/${month}`;
}
