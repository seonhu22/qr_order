import { buildOrderBoardDatetime } from '../utils';
import type { StaffCallBoardRow } from '../types';

/**
 * 직원호출 실시간 요청 mock 데이터.
 * client 쪽에 이 데이터를 낼 API/스토어가 아직 없어(consumer의 직원호출은 그 소비자 화면에만
 * 토스트를 띄울 뿐 테이블 정보를 서버에 남기지 않는다) 임의로 구성했다.
 * 항목명은 직원호출 관리(`staffCallManagementMock.ts`)의 호출명을 그대로 가져다 썼다.
 */
const today = new Date();

function todayAt(hours: number, minutes: number): string {
  return buildOrderBoardDatetime(today, hours, minutes);
}

export const STAFF_CALL_BOARD_MOCK: StaffCallBoardRow[] = [
  {
    id: 'staff-call-001',
    tableNum: '2',
    calledAt: todayAt(14, 32),
    items: [
      { name: '물', qty: 2 },
      { name: '수저', qty: 1 },
    ],
  },
  {
    id: 'staff-call-002',
    tableNum: '5',
    calledAt: todayAt(14, 28),
    // 반찬추가는 단건 항목이라 수량이 없다(staffCallManagementMock.ts의 singleYn: 'Y' 참고).
    items: [{ name: '반찬추가' }],
  },
  {
    id: 'staff-call-003',
    tableNum: '9',
    calledAt: todayAt(14, 15),
    items: [
      { name: '앞접시', qty: 1 },
      { name: '물티슈', qty: 3 },
    ],
  },
];
