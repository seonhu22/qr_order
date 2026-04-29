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

  it('uses the immediate parent as breadcrumb depth2 for deeper paths', () => {
    const deepCatalog = createMenuCatalog([
      ...catalog.items.map((item) => ({
        sysId: item.sysId,
        menuCd: item.menuCd,
        menuNm: item.menuNm,
        parentMenuCd: item.parentMenuCd,
        ordNo: String(item.ordNo),
        treeLevel: String(item.treeLevel),
        menuUrl: item.path || undefined,
      })),
      {
        sysId: '7',
        menuCd: 'commonCodeEditor',
        menuNm: '공통코드 편집',
        parentMenuCd: 'commonCode',
        ordNo: '1',
        treeLevel: '4',
        menuUrl: '/admin/system/common-code/edit',
      },
    ]);

    const navigation = createAdminNavigationData(
      deepCatalog.items,
      '/admin/system/common-code/edit',
    );

    expect(navigation.breadcrumb).toEqual({
      depth1: '시스템',
      depth2: '공통코드 관리',
      current: '공통코드 편집',
    });
  });

  it('hides sections that have no navigable descendants', () => {
    const emptySectionCatalog = createMenuCatalog([
      ...catalog.items.map((item) => ({
        sysId: item.sysId,
        menuCd: item.menuCd,
        menuNm: item.menuNm,
        parentMenuCd: item.parentMenuCd,
        ordNo: String(item.ordNo),
        treeLevel: String(item.treeLevel),
        menuUrl: item.path || undefined,
      })),
      {
        sysId: '8',
        menuCd: 'emptySection',
        menuNm: '빈 섹션',
        parentMenuCd: 'ROOT',
        ordNo: '4',
        treeLevel: '1',
      },
    ]);

    const navigation = createAdminNavigationData(emptySectionCatalog.items, '/admin/notice/manage');

    expect(navigation.headerSections.map((section) => section.section)).not.toContain('emptySection');
  });

  it('guards against duplicate menuCd and self-parent cycles', () => {
    const invalidCatalog = createMenuCatalog([
      {
        sysId: '10',
        menuCd: 'system',
        menuNm: '시스템',
        parentMenuCd: 'ROOT',
        ordNo: '1',
        treeLevel: '1',
      },
      {
        sysId: '11',
        menuCd: 'dupMenu',
        menuNm: '중복1',
        parentMenuCd: 'system',
        ordNo: '1',
        treeLevel: '2',
        menuUrl: '/admin/system/dup-1',
      },
      {
        sysId: '12',
        menuCd: 'dupMenu',
        menuNm: '중복2',
        parentMenuCd: 'system',
        ordNo: '2',
        treeLevel: '2',
        menuUrl: '/admin/system/dup-2',
      },
      {
        sysId: '13',
        menuCd: 'selfLoop',
        menuNm: '셀프 루프',
        parentMenuCd: 'selfLoop',
        ordNo: '3',
        treeLevel: '2',
        menuUrl: '/admin/system/self-loop',
      },
    ]);

    const navigation = createAdminNavigationData(invalidCatalog.items, '/admin/system/dup-1');

    expect(navigation.currentMenu?.menuNm).toBe('중복1');
    expect(navigation.headerSections.map((section) => section.section)).toContain('selfLoop');
  });
});
