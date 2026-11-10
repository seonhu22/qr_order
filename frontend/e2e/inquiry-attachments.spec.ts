import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { installInquiryAttachmentApi } from './fixtures/inquiryAttachmentApi';

test('문의 답변 첨부파일 저장 실패 후 초안을 유지하고 multipart로 재시도한다', async ({ context, page }) => {
  const api = await installInquiryAttachmentApi(context);
  await page.goto('/admin/inquiry/manage');
  await page.getByRole('button', { name: '결제 문의 상세 보기', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '문의사항 상세', exact: true });
  await editor.getByPlaceholder('답변 내용을 입력하세요').fill('확인했습니다.');
  const input = editor.locator('input[type="file"]');
  await expect(input).toBeEnabled();
  await input.setInputFiles({ name: 'answer.png', mimeType: 'image/png', buffer: Buffer.from('answer-content') });
  await editor.getByRole('button', { name: '확인', exact: true }).click();
  const error = page.getByRole('dialog', { name: '오류', exact: true });
  await expect(error).toBeVisible();
  await error.getByRole('button', { name: '확인', exact: true }).click();
  await expect(editor.getByPlaceholder('답변 내용을 입력하세요')).toHaveValue('확인했습니다.');
  await expect(editor.getByText('answer.png', { exact: true })).toBeVisible();
  await editor.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('답변이 저장되었습니다.', { exact: true })).toBeVisible();

  expect(api.savedForms).toHaveLength(2);
  for (const form of api.savedForms) {
    expect(form).toMatchObject({
      sysId: 'browser-qna', answerYn: 'Y', answerDescription: '확인했습니다.',
      'newItems[0].linkSysId': 'browser-qna', 'newItems[0].ordNo': '1',
      'newItems[0].convertFileNm': expect.stringMatching(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i),
      'newItems[0].file': { name: 'answer.png', type: 'image/png', content: 'answer-content' },
    });
    expect(Object.keys(form).some((key) => key.startsWith('delItems'))).toBe(false);
  }
  expect(api.unexpectedRequests).toEqual([]);
});
