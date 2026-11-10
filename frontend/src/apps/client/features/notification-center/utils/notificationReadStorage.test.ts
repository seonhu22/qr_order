import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readNotificationIds, saveNotificationIds } from './notificationReadStorage';

describe('notificationReadStorage', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it('사용자와 매장별 읽음을 분리하고 최근 1000개만 저장한다', () => {
    saveNotificationIds('u1', 'p1', Array.from({ length: 1005 }, (_, i) => `id-${i}`));
    expect(readNotificationIds('u1', 'p1')).toHaveLength(1000);
    expect(readNotificationIds('u1', 'p1')[0]).toBe('id-5');
    expect(readNotificationIds('u2', 'p1')).toEqual([]);
    expect(readNotificationIds('u1', 'p2')).toEqual([]);
  });
  it('잘못된 JSON과 storage 차단이 화면을 중단하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{');
    expect(readNotificationIds('u', 'p')).toEqual([]);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => saveNotificationIds('u', 'p', ['id'])).not.toThrow();
  });
});
