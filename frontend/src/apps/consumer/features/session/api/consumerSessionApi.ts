import type { ConsumerSession } from '../types';

/** 실제 매장명 API가 없는 동안 헤더·배너에 쓰는 임시 매장명. */
export const MOCK_STORE_NAME = '맛나분식';

const FALLBACK_SESSION: ConsumerSession = {
  sysPlantCd: 'ADMIN',
  tableSysId: 'table-003',
  storeName: MOCK_STORE_NAME,
  tableName: '내부 1번',
  tableNum: 3,
  tableQty: 4,
};

/**
 * GET /api/client/consumer/session 계약이 확정되면 이 함수 본문을 httpClient 호출로 교체한다.
 * 지금은 네트워크 호출이 없는 stub이며, QR을 거치지 않고 들어와도 흐름을 볼 수 있도록
 * 3번 테이블을 고정값으로 돌려준다.
 */
export function fetchConsumerSessionStub(): Promise<ConsumerSession | null> {
  return Promise.resolve(FALLBACK_SESSION);
}
