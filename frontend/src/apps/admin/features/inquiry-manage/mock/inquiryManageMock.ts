import type { QnaResponse } from '@/generated/types/qnaResponse';

export const INQUIRY_MANAGE_MOCK_ROWS: QnaResponse[] = [
  {
    sysId: '1',
    qnaTitle: '결제 오류가 발생했습니다',
    qnaDescription: 'QR 코드 결제 시 오류가 반복적으로 발생합니다. 확인 부탁드립니다.',
    startDate: { Year: 2026, Month: 3, Day: 10 },
    fileUuid: 'file-uuid-qna-1',
    answerYn: 'Y',
    answerDatetime: { Year: 2026, Month: 3, Day: 12 },
    answerDescription: '확인하여 조치 완료하였습니다.',
  },
  {
    sysId: '2',
    qnaTitle: '메뉴 등록 방법 문의',
    qnaDescription: '신규 메뉴를 등록하는 방법을 알고 싶습니다.',
    startDate: { Year: 2026, Month: 4, Day: 1 },
    answerYn: 'N',
    answerDatetime: undefined,
    answerDescription: '',
  },
  {
    sysId: '3',
    qnaTitle: '라이센스 갱신 문의',
    qnaDescription: '라이센스 만료일이 다가오는데 갱신 절차가 어떻게 되나요?',
    startDate: { Year: 2026, Month: 4, Day: 5 },
    answerYn: 'N',
    answerDatetime: undefined,
    answerDescription: '',
  },
  {
    sysId: '4',
    qnaTitle: '프린터 연결 문제',
    qnaDescription: '영수증 프린터가 연결되지 않습니다.',
    startDate: { Year: 2026, Month: 4, Day: 8 },
    answerYn: 'Y',
    answerDatetime: { Year: 2026, Month: 4, Day: 9 },
    answerDescription: '드라이버 재설치로 해결됩니다.',
  },
];