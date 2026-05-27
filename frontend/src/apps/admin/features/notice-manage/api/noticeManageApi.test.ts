import { describe, expect, it } from 'vitest';
import { buildNoticeFormData, mapToNoticeManageRow } from './noticeManageApi';

describe('noticeManageApi', () => {
  it('maps notice response metadata into page row when backend provides extra fields', () => {
    expect(
      mapToNoticeManageRow(
        {
          sysId: 'notice-1',
          noticeTitle: '점검 공지',
          noticeDescription: '시스템 점검 안내',
          startDate: '2026-04-29',
          useYn: 'N',
          fileUlid: 'file-link-1',
          insertUserId: 'PC001',
          insertDatetime: '2026-04-29 10:00:00',
          modifyDatetime: '2026-04-29 11:00:00.123456',
        },
        0,
      ),
    ).toEqual({
      id: 'notice-1',
      sysId: 'notice-1',
      fileUlid: 'file-link-1',
      useYn: 'N',
      noticeType: 'notice',
      target: 'all',
      title: '점검 공지',
      content: '시스템 점검 안내',
      registrant: 'PC001',
      registeredAt: '2026-04-29 10:00:00',
      updatedAt: '2026-04-29 11:00:00',
    });
  });

  it('falls back to synthetic row id when sysId is missing from response', () => {
    expect(
      mapToNoticeManageRow(
        {
          noticeTitle: '점검 공지',
          noticeDescription: '시스템 점검 안내',
          startDate: '2026-04-29',
        },
        2,
      ),
    ).toEqual({
      id: 'notice-2-점검 공지-2026-04-29',
      sysId: '',
      fileUlid: undefined,
      useYn: 'Y',
      noticeType: 'notice',
      target: 'all',
      title: '점검 공지',
      content: '시스템 점검 안내',
      registrant: '',
      registeredAt: '2026-04-29',
      updatedAt: '',
    });
  });

  it('builds notice update multipart form data with flat notice fields and indexed file items', () => {
    const file = new File(['hello'], 'notice.txt', { type: 'text/plain' });
    const formData = buildNoticeFormData({
      sysId: 'notice-1',
      fileUlid: 'file-link-1',
      useYn: 'N',
      title: '공지 제목',
      content: '공지 내용',
      fileChangeState: {
        newFiles: [file],
        deletedFiles: [
          {
            sysId: 'file-1',
            linkSysId: 'file-link-1',
            originalFileNm: 'old.pdf',
            convertFileNm: 'old-converted',
            fileExt: 'pdf',
            mimeType: 'application/pdf',
            fileSize: '100',
            filePath: '/2026/04',
            ordNo: 1,
            pdfYn: 'Y',
          },
        ],
      },
    });

    expect(formData.get('noticeTitle')).toBe('공지 제목');
    expect(formData.get('noticeDescription')).toBe('공지 내용');
    expect(formData.get('useYn')).toBe('N');
    expect(formData.get('sysId')).toBe('notice-1');
    expect(formData.get('fileUuid')).toBe('file-link-1');
    expect(formData.get('newItems[0].file')).toBe(file);
    expect(formData.get('newItems[0].linkSysId')).toBe('file-link-1');
    expect(formData.get('newItems[0].ordNo')).toBe('1');
    expect(formData.get('delItems[0].sysId')).toBe('file-1');
    expect(formData.has('noticeRequest')).toBe(false);
    expect(formData.has('fileRequest')).toBe(false);
  });

  it('does not send fileUuid or linkSysId for new notice because backend owns file group id creation', () => {
    const file = new File(['hello'], 'notice.txt', { type: 'text/plain' });
    const formData = buildNoticeFormData({
      title: '공지 제목',
      content: '공지 내용',
      fileChangeState: {
        newFiles: [file],
        deletedFiles: [],
      },
    });

    expect(formData.has('fileUuid')).toBe(false);
    expect(formData.get('newItems[0].file')).toBe(file);
    expect(formData.has('newItems[0].linkSysId')).toBe(false);
    expect(formData.get('newItems[0].ordNo')).toBe('1');
  });

  it('omits file item arrays when there are no file changes', () => {
    const formData = buildNoticeFormData({
      title: '공지 제목',
      content: '공지 내용',
      fileChangeState: {
        newFiles: [],
        deletedFiles: [],
      },
    });

    expect(formData.has('newItems')).toBe(false);
    expect(formData.has('updateItems')).toBe(false);
    expect(formData.has('delItems')).toBe(false);
    expect(formData.has('newItems[0].file')).toBe(false);
    expect(formData.has('delItems[0].sysId')).toBe(false);
  });
});
