import type { StaffCallNotification } from '../api/staffCallNotificationApi';

/**
 * 백엔드 미확인 직원호출 API가 아직 없어 임시로 사용하는 mock 데이터.
 * 주문 상태 보드의 직원호출 컬럼에 여러 장을 띄워 카드 제거 애니메이션을 확인할 수 있게
 * 테이블·항목 개수가 다른 호출을 섞어 넣었다.
 */
const today = new Date();

function todayAt(hours: number, minutes: number): string {
  const date = new Date(today);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const STAFF_CALL_NOTIFICATIONS_MOCK: StaffCallNotification[] = [
  {
    masterSysId: 'staff-call-001',
    tableSysId: 'table-001',
    tableNum: 1,
    insertDatetime: todayAt(13, 10),
    items: [
      { sysId: 's1', callCd: 'TMP001', callNm: '물', quantity: 2 },
    ],
  },
  {
    masterSysId: 'staff-call-002',
    tableSysId: 'table-002',
    tableNum: 2,
    insertDatetime: todayAt(13, 15),
    items: [
      { sysId: 's6', callCd: 'TMP006', callNm: '수저', quantity: 2 },
      { sysId: 's7', callCd: 'TMP007', callNm: '젓가락', quantity: 2 },
      { sysId: 's4', callCd: 'TMP004', callNm: '냅킨', quantity: 1 },
    ],
  },
  {
    masterSysId: 'staff-call-003',
    tableSysId: 'table-003',
    tableNum: 3,
    insertDatetime: todayAt(13, 20),
    items: [
      { sysId: 's8', callCd: 'TMP008', callNm: '반찬추가', quantity: 1 },
    ],
  },
  {
    masterSysId: 'staff-call-004',
    tableSysId: 'table-004',
    tableNum: 4,
    insertDatetime: todayAt(13, 22),
    items: [
      { sysId: 's2', callCd: 'TMP002', callNm: '앞접시', quantity: 3 },
      { sysId: 's3', callCd: 'TMP003', callNm: '컵', quantity: 3 },
      { sysId: 's5', callCd: 'TMP005', callNm: '물티슈', quantity: 2 },
      { sysId: 's9', callCd: 'TMP009', callNm: '소스추가', quantity: 1 },
    ],
  },
  {
    masterSysId: 'staff-call-005',
    tableSysId: 'table-005',
    tableNum: 5,
    insertDatetime: todayAt(13, 25),
    items: [
      { sysId: 's1', callCd: 'TMP001', callNm: '물', quantity: 1 },
    ],
  },
];
