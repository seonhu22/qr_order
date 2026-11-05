import type { ClientNotificationItem } from '../types';

/**
 * 공지/문의답변 실제 연동(API 폴링) 전까지 01 관리자 알림 UI 확인용으로 쓰는 임시 mock 데이터.
 * 실데이터 연동 시 이 파일과 useManagerNotificationCenterMock을 교체한다.
 */
const today = new Date();

function todayAt(hours: number, minutes: number): string {
  const date = new Date(today);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const CLIENT_NOTIFICATION_MOCK: ClientNotificationItem[] = [
  {
    kind: 'notice',
    sysId: 'notice-mock-001',
    title: '시스템 점검 공지',
    body: '3월 20일 새벽 2~4시 시스템 점검이 예정되어 있습니다. 해당 시간 중 서비스 이용이 제한됩니다.',
    timestamp: todayAt(13, 10),
    seen: false,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'qna',
    sysId: 'qna-mock-001',
    title: '문의 답변 완료',
    body: '[메뉴 이미지 업로드 문제] 문의에 대한 답변이 등록되었습니다.',
    timestamp: todayAt(11, 30),
    seen: false,
    targetPath: '/client/board/inquiry/management',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-002',
    title: '결제 모듈 업데이트',
    body: '카카오페이 연동이 업데이트 완료되었습니다. 즉시 사용 가능합니다.',
    timestamp: todayAt(9, 0),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'qna',
    sysId: 'qna-mock-002',
    title: '문의 답변 완료',
    body: '[정산 내역 다운로드] 문의에 대한 답변이 등록되었습니다.',
    timestamp: todayAt(8, 20),
    seen: true,
    targetPath: '/client/board/inquiry/management',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-003',
    title: '여름철 배달 지연 안내',
    body: '폭우로 인한 배달 지연이 예상되는 지역이 있어 안내드립니다. 자세한 내용은 공지사항 본문을 확인해 주세요.',
    timestamp: todayAt(7, 40),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'qna',
    sysId: 'qna-mock-003',
    title: '문의 답변 완료',
    body: '[포인트 적립 오류] 문의에 대한 답변이 등록되었습니다.',
    timestamp: todayAt(6, 50),
    seen: true,
    targetPath: '/client/board/inquiry/management',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-004',
    title: '신규 메뉴 등록 가이드 업데이트',
    body: '메뉴 옵션 그룹 설정 방법이 추가된 가이드 문서가 게시되었습니다.',
    timestamp: todayAt(5, 30),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'qna',
    sysId: 'qna-mock-004',
    title: '문의 답변 완료',
    body: '[영수증 발행 설정] 문의에 대한 답변이 등록되었습니다.',
    timestamp: todayAt(4, 10),
    seen: true,
    targetPath: '/client/board/inquiry/management',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-005',
    title: '개인정보처리방침 개정 안내',
    body: '2026년 11월 1일부터 개정된 개인정보처리방침이 적용됩니다. 주요 변경 사항을 꼭 확인해 주세요.',
    timestamp: todayAt(2, 0),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'qna',
    sysId: 'qna-mock-005',
    title: '문의 답변 완료',
    body: '[테이블 QR 재발급] 문의에 대한 답변이 등록되었습니다.',
    timestamp: todayAt(0, 30),
    seen: true,
    targetPath: '/client/board/inquiry/management',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-006',
    title: '추석 연휴 고객센터 운영 안내',
    body: '추석 연휴 기간 중 고객센터 운영 시간이 단축됩니다. 긴급 문의는 공지사항의 비상 연락처를 이용해 주세요.',
    timestamp: todayAt(23, 50),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-007',
    title: '정산 주기 변경 안내',
    body: '다음 달부터 정산 주기가 주 1회에서 주 2회로 변경됩니다.',
    timestamp: todayAt(22, 15),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
  {
    kind: 'notice',
    sysId: 'notice-mock-008',
    title: '앱 버전 업데이트 안내',
    body: '태블릿 주문 앱이 최신 버전으로 업데이트되었습니다. 재부팅 후 변경된 화면을 확인해 주세요.',
    timestamp: todayAt(20, 5),
    seen: true,
    targetPath: '/client/board/notice/list',
  },
];
