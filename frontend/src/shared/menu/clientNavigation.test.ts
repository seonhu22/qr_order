import { describe, expect, it } from 'vitest';
import { createClientNavigationData, findClientMenuCdByPath } from './clientNavigation';

describe('clientNavigation', () => {
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
