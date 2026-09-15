import { describe, expect, it } from 'vitest';
import { createMenuCatalog } from '@/shared/menu/menuCatalog';
import { BOARD_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/boardSidebarMenu';
import { SYSTEM_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/systemSidebarMenu';
import {
  applyMenuCatalogToSidebarMenus,
  detectSectionFromMenus,
  findSidebarNavigationByPath,
} from './adminMenuCatalogNav';

const catalog = createMenuCatalog([
  {
    sysId: '1',
    menuCd: 'commonCode',
    menuNm: '공통코드 최신명',
    parentMenuCd: 'ROOT',
    ordNo: 1,
    treeLevel: 1,
    menuUrl: '/admin/system/common-code',
  },
  {
    sysId: '2',
    menuCd: 'noticeManage',
    menuNm: '공지사항 최신명',
    parentMenuCd: 'ROOT',
    ordNo: 2,
    treeLevel: 1,
    menuUrl: '/admin/notice/manage',
  },
]);

describe('adminMenuCatalogNav', () => {
  it('overrides sidebar item labels and paths with menu catalog values when available', () => {
    const systemMenus = applyMenuCatalogToSidebarMenus(SYSTEM_SIDEBAR_MENU, catalog);

    const commonCodeItem = systemMenus[0].groups[0].items[0];
    expect(commonCodeItem.label).toBe('공통코드 최신명');
    expect(commonCodeItem.path).toBe('/admin/system/common-code');
  });

  it('finds breadcrumb/navigation labels by current path', () => {
    const boardMenus = applyMenuCatalogToSidebarMenus(BOARD_SIDEBAR_MENU, catalog);
    const navigation = findSidebarNavigationByPath('/admin/notice/manage', boardMenus);

    expect(navigation).toMatchObject({
      depth1Label: '게시판',
      depth2Label: '공지사항',
      itemLabel: '공지사항 최신명',
    });
  });

  it('detects section by current path using sidebar menus', () => {
    const systemMenus = applyMenuCatalogToSidebarMenus(SYSTEM_SIDEBAR_MENU, catalog);
    const boardMenus = applyMenuCatalogToSidebarMenus(BOARD_SIDEBAR_MENU, catalog);

    expect(detectSectionFromMenus('/admin/system/common-code', systemMenus, boardMenus)).toBe(
      'system',
    );
    expect(detectSectionFromMenus('/admin/notice/manage', systemMenus, boardMenus)).toBe('board');
  });
});
