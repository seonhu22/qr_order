import { describe, expect, it } from 'vitest';
import type { Menu } from '@/generated/types/menu';
import {
  createMenuCatalog,
    findBestPathMatch,
  findMenuByCd,
  findMenuByPath,
  getMenuNmByCd,
  mapMenuToCatalogItem,
  normalizeMenuPath,
  resolveMenuDisplayName,
} from './menuCatalog';

const MENU_FIXTURES: Menu[] = [
  {
    sysId: 'menu-1',
    menuCd: 'commonCode',
    menuNm: '공통코드',
    parentMenuCd: 'ROOT',
    ordNo: 1,
    treeLevel: 1,
    menuUrl: '/admin/system/common-code',
  },
  {
    sysId: 'menu-2',
    menuCd: 'plantSearch',
    menuNm: '사업장 조회',
    parentMenuCd: 'ROOT',
    ordNo: 2,
    treeLevel: 1,
    menuUrl: '/admin/system/plant/',
  },
  {
    sysId: 'menu-3',
    menuCd: 'noticeManage',
    menuNm: '공지사항',
    parentMenuCd: 'ROOT',
    ordNo: 3,
    treeLevel: 1,
    menuUrl: '/admin/notice/manage',
  },
  {
    sysId: 'menu-4',
    menuCd: 'menuFolder',
    menuNm: '폴더형 메뉴',
    parentMenuCd: 'ROOT',
    ordNo: 4,
    treeLevel: 1,
    menuUrl: '',
  },
];

describe('menuCatalog', () => {
  it('normalizes generated menu data into a shared menu catalog item', () => {
    expect(mapMenuToCatalogItem(MENU_FIXTURES[1])).toEqual({
      sysId: 'menu-2',
      menuCd: 'plantSearch',
      menuNm: '사업장 조회',
      parentMenuCd: 'ROOT',
      path: '/admin/system/plant',
      ordNo: 2,
      treeLevel: 1,
    });
  });

  it('creates lookup maps for menu code and path', () => {
    const catalog = createMenuCatalog(MENU_FIXTURES);

    expect(findMenuByCd(catalog, 'commonCode')?.menuNm).toBe('공통코드');
    expect(findMenuByPath(catalog, '/admin/system/plant')?.menuCd).toBe('plantSearch');
    expect(getMenuNmByCd(catalog, 'noticeManage')).toBe('공지사항');
  });

  it('uses exact match first and then the longest parent path match', () => {
    const catalog = createMenuCatalog(MENU_FIXTURES);

    expect(findMenuByPath(catalog, '/admin/system/common-code')?.menuCd).toBe('commonCode');
    expect(findMenuByPath(catalog, '/admin/system/plant/new')?.menuCd).toBe('plantSearch');
  });

  it('ignores empty menu paths when matching pathname', () => {
    const catalog = createMenuCatalog(MENU_FIXTURES);

    expect(findMenuByPath(catalog, '/admin/menu-folder')).toBeUndefined();
  });

  it('normalizes trailing slashes consistently', () => {
    expect(normalizeMenuPath('/admin/system/plant/')).toBe('/admin/system/plant');
    expect(normalizeMenuPath('')).toBe('');
  });

  it('can match generic path items with the same exact/prefix rule', () => {
    const items = [
      { key: 'commonCode', path: '/admin/system/common-code' },
      { key: 'plantSearch', path: '/admin/system/plant' },
    ] as const;

    expect(findBestPathMatch(items, '/admin/system/common-code')?.key).toBe('commonCode');
    expect(findBestPathMatch(items, '/admin/system/plant/new')?.key).toBe('plantSearch');
  });

  it('resolves display menu name in the order of response name, catalog name, and menu code', () => {
    const catalog = createMenuCatalog(MENU_FIXTURES);

    expect(resolveMenuDisplayName(catalog, 'commonCode', '응답 메뉴명')).toBe('응답 메뉴명');
    expect(resolveMenuDisplayName(catalog, 'commonCode', '')).toBe('공통코드');
    expect(resolveMenuDisplayName(catalog, 'unknownMenu', '')).toBe('unknownMenu');
  });
});
