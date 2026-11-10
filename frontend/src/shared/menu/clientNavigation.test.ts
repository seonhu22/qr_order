import { describe, expect, it } from 'vitest';
import { createClientNavigationData, findClientMenuCdByPath } from './clientNavigation';

describe('clientNavigation', () => {
  it('filters static menu/option management for staff but retains staff calls', () => {
    const navigation = createClientNavigationData([], '/client/main', '02');
    const paths = Object.values(navigation.menusBySection).flatMap((menus) => menus.flatMap((menu) => menu.groups.flatMap((group) => group.items.map((item) => item.path))));
    expect(paths).not.toContain('/client/menu/info/management');
    expect(paths).not.toContain('/client/menu/info/option');
    expect(paths).toContain('/client/menu/info/staff-call');
    expect(paths).toContain('/client/order/status/management');
    expect(createClientNavigationData([], '/client/menu/info/option', '01').currentMenuCd).toBe('MNU_INFO_OPT');
  });

  it('filters server catalog paths without restoring forbidden static fallback', () => {
    const items = [
      { menuCd: 'CLIENT', menuNm: 'CLIENT', parentMenuCd: 'ROOT', ordNo: 1, treeLevel: 0, path: '' },
      { menuCd: 'CUSTOM', menuNm: '설정', parentMenuCd: 'CLIENT', ordNo: 1, treeLevel: 1, path: '' },
      { menuCd: 'GROUP', menuNm: '설정', parentMenuCd: 'CUSTOM', ordNo: 1, treeLevel: 2, path: '' },
      { menuCd: 'UNEXPECTED_CODE', menuNm: '옵션', parentMenuCd: 'GROUP', ordNo: 1, treeLevel: 3, path: '/client/menu/info/option' },
    ];
    const denied = createClientNavigationData(items, '/client/menu/info/option', '02');
    expect(denied.headerSections).toEqual([]);
    expect(denied.currentMenus).toEqual([]);
    expect(denied.currentMenuCd).toBeUndefined();
    expect(denied.breadcrumb).toBeNull();
    expect(createClientNavigationData(items, '/client/menu/info/option', '01').currentMenuCd).toBe('UNEXPECTED_CODE');
  });

  it('finds the static client menu code from pathname', () => {
    expect(findClientMenuCdByPath('/client/store/info/base')).toBe('STO_INFO_BASE');
  });

  it('returns undefined when pathname does not match a client menu', () => {
    expect(findClientMenuCdByPath('/client/main')).toBeUndefined();
  });

  it('uses static menu code when server menu catalog is empty', () => {
    expect(createClientNavigationData([], '/client/store/info/base').currentMenuCd).toBe(
      'STO_INFO_BASE',
    );
  });

  it('uses server menu code when server menu catalog matches the current path', () => {
    expect(
      createClientNavigationData(
        [
          {
            sysId: 'root',
            menuCd: 'CLIENT',
            menuNm: 'CLIENT',
            parentMenuCd: 'ROOT',
            ordNo: 1,
            treeLevel: 0,
            path: '',
          },
          {
            sysId: 'section',
            menuCd: 'SERVER_STO',
            menuNm: '매장',
            parentMenuCd: 'CLIENT',
            ordNo: 1,
            treeLevel: 1,
            path: '',
          },
          {
            sysId: 'group',
            menuCd: 'SERVER_STO_INFO',
            menuNm: '매장 정보 관리',
            parentMenuCd: 'SERVER_STO',
            ordNo: 1,
            treeLevel: 2,
            path: '',
          },
          {
            sysId: 'leaf',
            menuCd: 'SERVER_STO_INFO_BASE',
            menuNm: '매장 기본 정보',
            parentMenuCd: 'SERVER_STO_INFO',
            ordNo: 1,
            treeLevel: 3,
            path: '/client/store/info/base',
          },
        ],
        '/client/store/info/base',
      ).currentMenuCd,
    ).toBe('SERVER_STO_INFO_BASE');
  });
});
