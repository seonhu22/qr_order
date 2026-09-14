import { describe, expect, it } from 'vitest';
import { mapConsumerSession } from './consumerSessionApi';

describe('mapConsumerSession', () => {
  it('maps lifecycle and ordering availability independently', () => {
    expect(
      mapConsumerSession({
        consumerSessionId: 'visit-001',
        status: 'ACTIVE',
        sysPlantCd: 'ADMIN',
        storeName: '테스트 매장',
        tableSysId: 'table-001',
        tableName: '1번 테이블',
        tableNum: 1,
        tableQty: 4,
        orderingAllowed: false,
        orderingBlockedReason: 'TABLE_INACTIVE',
        startedAt: '2026-09-01 09:00:00',
      }),
    ).toMatchObject({
      status: 'active',
      orderingAllowed: false,
      orderingBlockedReason: 'TABLE_INACTIVE',
    });
  });
});
