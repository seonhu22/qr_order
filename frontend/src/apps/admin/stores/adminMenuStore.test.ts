import { beforeEach, describe, expect, it } from 'vitest';
import { useAdminMenuStore } from './adminMenuStore';

describe('adminMenuStore', () => {
  beforeEach(() => {
    useAdminMenuStore.getState().clearCurrentMenu();
  });

  it('stores the current menu code and path as UI state', () => {
    useAdminMenuStore.getState().setCurrentMenu('commonCode', '/admin/system/common-code');

    expect(useAdminMenuStore.getState()).toMatchObject({
      currentMenuCd: 'commonCode',
      currentPath: '/admin/system/common-code',
    });
  });

  it('can clear the current menu UI state', () => {
    useAdminMenuStore.getState().setCurrentMenu('coupon', '/admin/payment/coupon');
    useAdminMenuStore.getState().clearCurrentMenu();

    expect(useAdminMenuStore.getState()).toMatchObject({
      currentMenuCd: undefined,
      currentPath: '',
    });
  });
});
