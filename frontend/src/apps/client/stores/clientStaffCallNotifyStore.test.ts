import { beforeEach, describe, expect, it } from 'vitest';
import { useClientStaffCallNotifyStore } from './clientStaffCallNotifyStore';

describe('clientStaffCallNotifyStore', () => {
  beforeEach(() => useClientStaffCallNotifyStore.setState({ unreadCount: 0, latest: null }));

  it('호출 이벤트마다 배지를 증가시키고 확인하면 초기화한다', () => {
    const event = {
      tableSysId: 'TABLE-1', tableName: '3번', calledAt: '2026-09-15T18:00:00',
      items: [{ callCd: 'WATER', callName: '물', quantity: 2 }],
    };
    useClientStaffCallNotifyStore.getState().receive(event);
    useClientStaffCallNotifyStore.getState().receive(event);
    expect(useClientStaffCallNotifyStore.getState().unreadCount).toBe(2);
    expect(useClientStaffCallNotifyStore.getState().latest).toEqual(event);

    useClientStaffCallNotifyStore.getState().markRead();
    expect(useClientStaffCallNotifyStore.getState().unreadCount).toBe(0);
  });
});
