import { beforeEach, describe, expect, it } from 'vitest';
import {
  getUnreadStaffCallNotificationsMock,
  markAllStaffCallNotificationsReadMock,
  markStaffCallNotificationReadMock,
  resetStaffCallNotificationsMock,
  STAFF_CALL_NOTIFICATIONS_MOCK,
} from './staffCallNotificationsMock';

describe('staffCallNotificationsMock', () => {
  beforeEach(() => resetStaffCallNotificationsMock());

  it('개별 완료 후 해당 호출만 미확인 목록에서 제거한다', () => {
    const targetId = STAFF_CALL_NOTIFICATIONS_MOCK[0].masterSysId;

    markStaffCallNotificationReadMock(targetId);

    expect(getUnreadStaffCallNotificationsMock()).toHaveLength(
      STAFF_CALL_NOTIFICATIONS_MOCK.length - 1,
    );
    expect(
      getUnreadStaffCallNotificationsMock().some(({ masterSysId }) => masterSysId === targetId),
    ).toBe(false);
  });

  it('전체 완료 후 미확인 목록을 비운다', () => {
    markAllStaffCallNotificationsReadMock();

    expect(getUnreadStaffCallNotificationsMock()).toEqual([]);
  });
});
