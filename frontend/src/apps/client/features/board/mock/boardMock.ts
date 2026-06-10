import type { ClientNotice, ClientQna } from '../types';

export const CLIENT_NOTICE_ROWS: ClientNotice[] = [
  {
    id: 'notice-1',
    title: '서비스 점검 안내',
    createdAt: '2026-06-11',
    writer: '관리자',
    content: '서비스 안정화를 위한 점검이 예정되어 있습니다.',
    useYn: 'Y',
  },
  {
    id: 'notice-2',
    title: '정산 정책 변경 안내',
    createdAt: '2026-06-10',
    writer: '관리자',
    content: '정산 정책 일부가 변경됩니다.',
    useYn: 'Y',
  },
];

export const CLIENT_QNA_ROWS: ClientQna[] = [
  {
    id: 'qna-1',
    title: '영수증 출력 문의',
    createdAt: '2026-06-11',
    status: '답변완료',
    content: '영수증 출력 버튼이 보이지 않습니다.',
    answer: '답변 완료된 문의입니다.',
  },
  {
    id: 'qna-2',
    title: '메뉴 품절 처리 문의',
    createdAt: '2026-06-10',
    status: '답변대기',
    content: '품절 메뉴를 숨김 처리하고 싶습니다.',
  },
];
