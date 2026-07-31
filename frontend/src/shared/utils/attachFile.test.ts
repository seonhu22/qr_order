import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerFile } from '@/shared/components/file-attachment';
import { downloadAllFile, downloadFile } from '@/generated/file-controller/file-controller';
import { httpClient } from '@/shared/lib/httpClient';
import { triggerBlobDownload } from './downloadBlob';
import {
  buildAttachFileSaveFormData,
  downloadAllServerFiles,
  downloadServerFile,
  mapFileResponseToServerFile,
  saveAttachFiles,
} from './attachFile';

vi.mock('@/generated/file-controller/file-controller', () => ({
  downloadFile: vi.fn(),
  downloadAllFile: vi.fn(),
}));

vi.mock('@/shared/lib/httpClient', () => ({
  httpClient: vi.fn(),
}));

vi.mock('./downloadBlob', () => ({
  triggerBlobDownload: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);
const downloadAllFileMock = vi.mocked(downloadAllFile);
const httpClientMock = vi.mocked(httpClient);
const triggerBlobDownloadMock = vi.mocked(triggerBlobDownload);

describe('attachFile utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps FileResponse to ServerFile with safe fallback values', () => {
    expect(
      mapFileResponseToServerFile({
        sysId: 'file-1',
        originalFileNm: 'menu.pdf',
        fileExt: '.pdf',
        fileSize: '1200',
        filePath: '/2026/06',
        ordNo: 2,
        pdfYn: 'Y',
      }),
    ).toEqual({
      sysId: 'file-1',
      linkSysId: '',
      originalFileNm: 'menu.pdf',
      convertFileNm: 'file-1',
      fileExt: '.pdf',
      mimeType: '',
      fileSize: '1200',
      filePath: '/2026/06',
      ordNo: 2,
      pdfYn: 'Y',
    });
  });

  it('downloads one server file by sysId and original file name', async () => {
    const blob = new Blob(['file']);
    const file: ServerFile = {
      sysId: 'file-1',
      linkSysId: 'link-1',
      originalFileNm: 'menu.pdf',
      convertFileNm: 'converted',
      fileExt: '.pdf',
      mimeType: 'application/pdf',
      fileSize: '1200',
      filePath: '/2026/06',
      ordNo: 1,
      pdfYn: 'Y',
    };

    downloadFileMock.mockResolvedValue(blob);

    await downloadServerFile(file);

    expect(downloadFileMock).toHaveBeenCalledWith({ sysId: 'file-1' });
    expect(triggerBlobDownloadMock).toHaveBeenCalledWith(blob, 'menu.pdf');
  });

  it('downloads all files by linkSysId as a zip file', async () => {
    const blob = new Blob(['zip']);
    downloadAllFileMock.mockResolvedValue(blob);

    await downloadAllServerFiles('link-1');

    expect(downloadAllFileMock).toHaveBeenCalledWith({ linkSysId: 'link-1' });
    expect(triggerBlobDownloadMock).toHaveBeenCalledWith(blob, 'files.zip');
  });

  it('builds FormData for the separated attach file save API', () => {
    const file = new File(['image'], 'option.png', { type: 'image/png' });
    const formData = buildAttachFileSaveFormData('file-link-1', {
      newFiles: [file],
      deletedFiles: [
        {
          sysId: 'attach-1',
          linkSysId: 'file-link-1',
          originalFileNm: 'old.png',
          convertFileNm: 'old-convert',
          fileExt: '.png',
          mimeType: 'image/png',
          fileSize: '1',
          filePath: '/2026/07',
          ordNo: 1,
          pdfYn: 'N',
        },
      ],
    });

    expect(formData.get('newItems[0].file')).toBe(file);
    expect(formData.get('newItems[0].linkSysId')).toBe('file-link-1');
    expect(formData.get('newItems[0].convertFileNm')).toEqual(expect.any(String));
    expect(formData.get('newItems[0].filePath')).toMatch(/^\/\d{4}\/\d{2}$/);
    expect(formData.get('newItems[0].ordNo')).toBe('1');
    expect(formData.get('delItems[0].sysId')).toBe('attach-1');
  });

  it('saves files through the separated attach file API', async () => {
    const file = new File(['image'], 'option.png', { type: 'image/png' });

    httpClientMock.mockResolvedValue({ success: true });

    await saveAttachFiles('file-link-1', { newFiles: [file], deletedFiles: [] });

    expect(httpClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/attach_file/save',
        method: 'POST',
        data: expect.any(FormData),
      }),
    );
  });
});
