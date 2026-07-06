import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerFile } from '@/shared/components/file-attachment';
import { downloadAllFile, downloadFile } from '@/generated/file-controller/file-controller';
import { triggerBlobDownload } from './downloadBlob';
import { downloadAllServerFiles, downloadServerFile, mapFileResponseToServerFile } from './attachFile';

vi.mock('@/generated/file-controller/file-controller', () => ({
  downloadFile: vi.fn(),
  downloadAllFile: vi.fn(),
}));

vi.mock('./downloadBlob', () => ({
  triggerBlobDownload: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);
const downloadAllFileMock = vi.mocked(downloadAllFile);
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
});
