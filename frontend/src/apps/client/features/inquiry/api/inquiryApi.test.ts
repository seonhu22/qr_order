import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileChangeState } from '@/shared/components/file-attachment';
import { buildCreateInquiryFormData, postCreateInquiryFormData } from './inquiryApi';

describe('inquiryApi', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('builds inquiry create form data with flat qna fields only when there are no files', () => {
    const formData = buildCreateInquiryFormData({
      title: '문의 제목',
      content: '문의 내용',
      fileChangeState: {
        newFiles: [],
        deletedFiles: [],
      },
    });

    expect(formData.get('qnaTitle')).toBe('문의 제목');
    expect(formData.get('qnaDescription')).toBe('문의 내용');
    expect(formData.has('newItems[0].file')).toBe(false);
    expect(formData.has('clientQnaRequest')).toBe(false);
    expect(formData.has('fileRequest')).toBe(false);
  });

  it('builds inquiry create form data with indexed new file items', () => {
    const file = new File(['hello'], 'qna.txt', { type: 'text/plain' });
    const fileChangeState: FileChangeState = {
      newFiles: [file],
      deletedFiles: [],
    };

    const formData = buildCreateInquiryFormData({
      title: '첨부 문의',
      content: '첨부파일을 포함합니다.',
      fileChangeState,
    });

    expect(formData.get('qnaTitle')).toBe('첨부 문의');
    expect(formData.get('qnaDescription')).toBe('첨부파일을 포함합니다.');
    expect(formData.get('newItems[0].file')).toBe(file);
    expect(formData.get('newItems[0].convertFileNm')).toBe('00000000-0000-4000-8000-000000000001');
    expect(formData.get('newItems[0].filePath')).toMatch(/^\/\d{4}\/\d{2}$/);
    expect(formData.get('newItems[0].ordNo')).toBe('1');
    expect(formData.has('newItems[0].linkSysId')).toBe(false);
  });

  it('posts form data without setting Content-Type manually', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: null, error: null, message: '생성 완료.' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await postCreateInquiryFormData({
      title: '문의 제목',
      content: '문의 내용',
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/client/board/qna/new', {
      method: 'POST',
      body: expect.any(FormData),
      credentials: 'include',
    });
  });
});
