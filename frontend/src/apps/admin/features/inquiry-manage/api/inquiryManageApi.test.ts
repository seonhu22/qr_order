import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildInquiryAnswerFormData,
  buildInquiryAnswerUpdateRequest,
  mapToInquiryManageRow,
  updateInquiryAnswer,
} from './inquiryManageApi';

describe('inquiryManageApi', () => {
  it('sends new answer attachments with flat Qna and indexed FileRequest fields', async () => {
    const file = new File(['answer'], 'answer.txt', { type: 'text/plain' });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    await updateInquiryAnswer(buildInquiryAnswerUpdateRequest({ sysId: 'qna-1' }, '답변', {
      newFiles: [file], deletedFiles: [],
    }));
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const body = options.body as FormData;
    expect(body.get('sysId')).toBe('qna-1');
    expect(body.get('answerYn')).toBe('Y');
    expect(body.get('answerDescription')).toBe('답변');
    expect(body.get('newItems[0].file')).toBe(file);
    expect(body.get('newItems[0].linkSysId')).toBe('qna-1');
    expect(body.get('newItems[0].convertFileNm')).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.get('newItems[0].filePath')).toMatch(/^\/\d{4}\/\d{2}$/);
    expect(body.get('newItems[0].ordNo')).toBe('1');
    expect([...body.keys()]).toHaveLength(8);
  });

  it('rejects unsupported persisted file deletion before sending any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(updateInquiryAnswer({ sysId: 'qna-1', fileChangeState: {
      newFiles: [], deletedFiles: [{ sysId: 'file-1' } as never],
    } })).rejects.toThrow('기존 답변 첨부파일 삭제');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('displays persisted modification time and leaves unmodified inquiries empty', () => {
    const response = { sysId: 'qna-modified', modifyDatetime: '2026-11-10T10:11:12.123456' };
    expect(mapToInquiryManageRow(response, 0).updatedAt).toBe('2026-11-10 10:11:12');
    expect(mapToInquiryManageRow({ sysId: 'qna-new' }, 0).updatedAt).toBe('-');
    expect(mapToInquiryManageRow({ sysId: 'qna-null', modifyDatetime: null }, 0).updatedAt).toBe('-');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps qna response into inquiry row and preserves identifiers', () => {
    expect(
      mapToInquiryManageRow(
        {
          sysId: 'qna-1',
          qnaTitle: '문의 제목',
          writeUsername: '문의자',
          qnaDescription: '문의 내용',
          fileUlid: 'file-1',
          answerYn: 'Y',
          answerUserName: '답변자',
          answerDescription: '답변 내용',
          writeDatetime: '2026-04-30T10:17:00.123Z',
          answerDatetime: '2026-05-01T11:20:30.456Z',
        },
        0,
      ),
    ).toEqual({
      id: 'qna-1',
      sysId: 'qna-1',
      fileUlid: 'file-1',
      title: '문의 제목',
      content: '문의 내용',
      plant: '-',
      registrant: '문의자',
      registeredAt: '2026-04-30 10:17:00',
      updatedAt: '-',
      answeredAt: '2026-05-01 11:20:30',
      answerer: '답변자',
      answerStatus: 'answered',
      answerContent: '답변 내용',
    });
  });

  it('hides answerer when the inquiry is not answered yet', () => {
    expect(
      mapToInquiryManageRow(
        {
          sysId: 'qna-2',
          qnaTitle: '미답변 문의',
          qnaDescription: '미답변 상태에서는 답변자를 표시하지 않습니다.',
          answerYn: 'N',
          answerUserName: '관리자',
          writeDatetime: '2026-04-30T10:17:00.123Z',
        },
        0,
      ).answerer,
    ).toBe('-');
  });

  it('builds answer update payload with only backend-used fields', () => {
    expect(
      buildInquiryAnswerUpdateRequest(
        {
          sysId: 'qna-1',
        },
        '답변 등록',
      ),
    ).toEqual({
      sysId: 'qna-1',
      answerYn: 'Y',
      answerDescription: '답변 등록',
    });
  });

  it('builds flat form data for Spring ModelAttribute binding', () => {
    const formData = buildInquiryAnswerFormData({
      sysId: 'qna-1',
      answerYn: 'Y',
      answerDescription: '답변 등록',
    });

    expect(formData.get('sysId')).toBe('qna-1');
    expect(formData.get('answerYn')).toBe('Y');
    expect(formData.get('answerDescription')).toBe('답변 등록');
    expect(formData.has('qnaRequest')).toBe(false);
    expect(formData.has('fileRequest')).toBe(false);
  });

  it('posts answer fields as multipart form data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await updateInquiryAnswer({
      sysId: 'qna-1',
      answerYn: 'Y',
      answerDescription: '답변 등록',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/system/settings/board/qna/update');
    expect(options.method).toBe('POST');
    expect(options.headers).toBeUndefined();
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('answerDescription')).toBe('답변 등록');
  });
});
