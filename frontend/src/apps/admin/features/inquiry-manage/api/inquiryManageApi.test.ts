import { describe, expect, it } from 'vitest';
import {
  buildInquiryAnswerUpdateRequest,
  mapToInquiryManageRow,
} from './inquiryManageApi';

describe('inquiryManageApi', () => {
  it('maps qna response into inquiry row and preserves identifiers', () => {
    expect(
      mapToInquiryManageRow(
        {
          sysId: 'qna-1',
          qnaTitle: '문의 제목',
          qnaDescription: '문의 내용',
          fileUlid: 'file-1',
          answerYn: 'Y',
          answerDescription: '답변 내용',
          startDate: '2026-04-30T10:17:00.123Z',
          answerDatetime: '2026-05-01T11:20:30.456Z',
        },
        0,
      ),
    ).toEqual({
      id: 'qna-1',
      sysId: 'qna-1',
      fileUuid: 'file-1',
      title: '문의 제목',
      content: '문의 내용',
      plant: '-',
      registrant: '-',
      registeredAt: '2026-04-30 10:17:00',
      updatedAt: '-',
      answeredAt: '2026-05-01 11:20:30',
      answerStatus: 'answered',
      answerContent: '답변 내용',
    });
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
});
