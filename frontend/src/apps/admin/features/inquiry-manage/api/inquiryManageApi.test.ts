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
});
