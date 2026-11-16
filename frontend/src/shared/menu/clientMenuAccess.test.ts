import { describe, expect, it } from 'vitest';
import { canAccessClientMenuPath } from './clientMenuAccess';

describe('Client menu management policy', () => {
  it.each(['/client/store/user/management', '/CLIENT/STORE/USER/MANAGEMENT', '/client/store/%75ser/management'])('restricts user management %s to manager 01', (path) => {
    expect(canAccessClientMenuPath(path, '01')).toBe(true);
    expect(canAccessClientMenuPath(path, '02')).toBe(false);
  });
  it.each(['/client/menu/info/management', '/client/menu/info/option', '/client/menu/info/option/', '/client/menu/info/management/detail', '/CLIENT/MENU/INFO/OPTION', '/client/%6denu/info/option'])('restricts %s to staffRole 01', (path) => {
    expect(canAccessClientMenuPath(path, '01')).toBe(true);
    for (const role of ['02', undefined, '', 'ADMIN', '1']) {
      expect(canAccessClientMenuPath(path, role)).toBe(false);
    }
  });

  it.each(['/client/menu/info/staff-call', '/client/order/status/management', '/client/payment/status/list', '/client/menu/info/option-extra'])('preserves other work permissions: %s', (path) => {
    expect(canAccessClientMenuPath(path, '02')).toBe(true);
  });
});
