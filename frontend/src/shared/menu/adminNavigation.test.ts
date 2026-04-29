import { describe, expect, it } from 'vitest';
import { createMenuCatalog } from './menuCatalog';
import { buildAdminMenuTree, createAdminNavigationData } from './adminNavigation';

const catalog = createMenuCatalog([
  {
    sysId: '1',
    menuCd: 'system',
    menuNm: '시스템',
    parentMenuCd: 'ROOT',
    ordNo: '1',
    treeLevel: '1',
  },
  {
    sysId: '2',
    menuCd: 'systemManagement',
    menuNm: '시스템 관리',
    parentMenuCd: 'system',
    ordNo: '2',
    treeLevel: '2',
  },
  {
    sysId: '3',
    menuCd: 'board',
    menuNm: '게시판',
    parentMenuCd: 'ROOT',
    ordNo: '3',
    treeLevel: '1',
  },
  {
    sysId: '4',
    menuCd: 'commonCode',
    menuNm: '공통코드 관리',
    parentMenuCd: 'systemManagement',
    ordNo: '1',
    treeLevel: '3',
    menuUrl: '/admin/system/common-code',
  },
  {
    sysId: '5',
    menuCd: 'notice',
    menuNm: '공지사항',
    parentMenuCd: 'board',
    ordNo: '1',
    treeLevel: '2',
  },
  {
    sysId: '6',
    menuCd: 'noticeManage',
    menuNm: '공지사항 관리',
    parentMenuCd: 'notice',
    ordNo: '1',
    treeLevel: '3',
    menuUrl: '/admin/notice/manage',
  },
]);

describe('adminNavigation', () => {
  it('builds a sorted menu tree from normalized catalog items', () => {
    const tree = buildAdminMenuTree(catalog.items);

    expect(tree.map((node) => node.menuCd)).toEqual(['system', 'board']);
    expect(tree[0].children.map((node) => node.menuCd)).toEqual(['systemManagement']);
  });

  it('creates dynamic header/sidebar/breadcrumb data from sys_menu rows', () => {
    const navigation = createAdminNavigationData(catalog.items, '/admin/notice/manage');

    expect(navigation.headerSections).toEqual([
      { section: 'system', label: '시스템' },
      { section: 'board', label: '게시판' },
    ]);
    expect(navigation.currentSection).toBe('board');
    expect(navigation.menusBySection.board[0].groups[0].label).toBe('공지사항');
    expect(navigation.currentNavigation).toMatchObject({
      section: 'board',
      depth1Label: '게시판',
      depth2Label: '공지사항',
      itemLabel: '공지사항 관리',
    });
    expect(navigation.breadcrumb).toEqual({
      depth1: '게시판',
      depth2: '공지사항',
      current: '공지사항 관리',
    });
  });

  it('maps system routes to the system header section', () => {
    const navigation = createAdminNavigationData(catalog.items, '/admin/system/common-code');

    expect(navigation.currentSection).toBe('system');
    expect(navigation.currentNavigation).toMatchObject({
      section: 'system',
      depth2Label: '시스템 관리',
      itemLabel: '공통코드 관리',
    });
  });
});
