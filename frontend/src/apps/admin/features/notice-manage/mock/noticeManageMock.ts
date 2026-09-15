import type { NoticeResponse } from '@/generated/types/noticeResponse';

type NoticeMockRow = NoticeResponse & {
  sysId?: string;
  insertUserId?: string;
  insertUserNm?: string;
  insertDatetime?: string;
};

export const NOTICE_MOCK_ROWS: NoticeMockRow[] = [
  {
    sysId: 'notice-1',
    noticeTitle: '시스템 점검 안내',
    noticeDescription: '2026년 4월 30일 오전 2시부터 4시까지 시스템 점검이 진행됩니다.',
    startDate: '2026-04-22',
    fileUlid: 'file-uuid-notice-1',
    insertUserId: 'PC001',
    insertUserNm: '관리자',
    insertDatetime: '2026-04-22 09:00:00',
  },
  {
    sysId: 'notice-2',
    noticeTitle: '서비스 업데이트 공지',
    noticeDescription: 'QR Order 2.0 업데이트가 적용되었습니다. 주요 변경 사항을 확인해주세요.',
    startDate: '2026-04-20',
    fileUlid: '',
    insertUserId: 'PC001',
    insertUserNm: '관리자',
    insertDatetime: '2026-04-20 13:30:00',
  },
  {
    sysId: 'notice-3',
    noticeTitle: '개인정보 처리방침 변경 안내',
    noticeDescription: '개인정보 처리방침이 일부 변경되었습니다. 변경 내용을 확인해주세요.',
    startDate: '2026-04-15',
    fileUlid: '',
    insertUserId: 'PC002',
    insertUserNm: '매장관리자',
    insertDatetime: '2026-04-15 10:15:00',
  },
  {
    sysId: 'notice-4',
    noticeTitle: '사업장 등록 절차 변경 공지',
    noticeDescription: '사업장 등록 시 필요한 서류가 변경되었습니다. 자세한 내용은 고객센터로 문의하세요.',
    startDate: '2026-04-10',
    fileUlid: '',
    insertUserId: 'PC002',
    insertUserNm: '매장관리자',
    insertDatetime: '2026-04-10 14:45:00',
  },
  {
    sysId: 'notice-5',
    noticeTitle: '결제 수단 추가 안내',
    noticeDescription: '간편결제 수단이 추가되었습니다. 결제 설정에서 확인하실 수 있습니다.',
    startDate: '2026-04-05',
    fileUlid: '',
    insertUserId: 'PC003',
    insertUserNm: '운영담당자',
    insertDatetime: '2026-04-05 08:20:00',
  },
];
