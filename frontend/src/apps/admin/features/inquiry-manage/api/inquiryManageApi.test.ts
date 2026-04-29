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
          fileUuid: 'file-1',
          answerYn: 'Y',
          answerDescription: '답변 내용',
          startDate: {
            Year: 2026,
            Month: 4,
            Day: 30,
          },
          answerDatetime: {
            Year: 2026,
            Month: 5,
            Day: 1,
          },
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
      registeredAt: '2026-04-30',
      updatedAt: '-',
      answeredAt: '2026-05-01',
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
