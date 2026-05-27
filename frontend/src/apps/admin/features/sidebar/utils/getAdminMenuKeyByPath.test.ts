import { describe, expect, it } from 'vitest';
import { getAdminMenuKeyByPath } from './getAdminMenuKeyByPath';

describe('getAdminMenuKeyByPath', () => {
  it('returns system menu key for exact admin paths', () => {
    expect(getAdminMenuKeyByPath('/admin/payment/coupon')).toBe('coupon');
    expect(getAdminMenuKeyByPath('/admin/system/admin-user')).toBe('adminUser');
  });

  it('returns board menu key for exact board paths', () => {
    expect(getAdminMenuKeyByPath('/admin/notice/manage')).toBe('noticeManage');
  });

  it('matches nested paths to the closest parent menu item', () => {
    expect(getAdminMenuKeyByPath('/admin/system/plant/new')).toBe('plantSearch');
  });

  it('returns undefined for paths that are not sidebar menu pages', () => {
    expect(getAdminMenuKeyByPath('/admin')).toBeUndefined();
    expect(getAdminMenuKeyByPath('/admin/unknown')).toBeUndefined();
  });
});
