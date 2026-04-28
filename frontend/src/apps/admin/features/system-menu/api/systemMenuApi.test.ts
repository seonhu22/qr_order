import { describe, expect, it } from 'vitest';
import type { Menu } from '@/generated/types/menu';
import type { MenuNode } from '../types';
import {
  ROOT_PARENT_MENU_CD,
  buildMenuRequest,
  buildMenuTree,
  flattenMenuNodes,
  hasMenuChanges,
  markMenuNodesPersisted,
  mapToMenuPayload,
} from './systemMenuApi';

const menus: Menu[] = [
  {
    sysId: 'sys-1',
    menuCd: 'SYS',
    menuNm: '시스템',
    parentMenuCd: ROOT_PARENT_MENU_CD,
    ordNo: '1',
    treeLevel: '1',
  },
  {
    sysId: 'menu-1',
    menuCd: 'MENU',
    menuNm: '메뉴 관리',
    parentMenuCd: 'SYS',
    ordNo: '1',
    treeLevel: '2',
    menuUrl: '/admin/system/menu',
  },
  {
    sysId: 'code-1',
    menuCd: 'COMMON_CODE',
    menuNm: '공통코드',
    parentMenuCd: 'SYS',
    ordNo: '2',
    treeLevel: '2',
    menuUrl: '/admin/system/common-code',
  },
];

describe('systemMenuApi', () => {
  it('builds a sorted menu tree from server menu rows', () => {
    const tree = buildMenuTree([menus[2], menus[0], menus[1]]);

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      id: 'sys-1',
      label: 'SYS',
      data: {
        sysId: 'sys-1',
        parentMenuCd: ROOT_PARENT_MENU_CD,
        code: 'SYS',
        name: '시스템',
        ordNo: 1,
        treeLevel: 1,
      },
    });
    expect(tree[0].children?.map((node) => node.data?.code)).toEqual(['MENU', 'COMMON_CODE']);
  });

  it('flattens tree nodes with numeric ordNo, treeLevel, and parent menu code', () => {
    const tree = buildMenuTree(menus);
    const payloads = flattenMenuNodes(tree).map(mapToMenuPayload);

    expect(payloads).toEqual([
      {
        sysId: 'sys-1',
        menuCd: 'SYS',
        menuNm: '시스템',
        parentMenuCd: ROOT_PARENT_MENU_CD,
        ordNo: 1,
        treeLevel: 1,
        menuUrl: undefined,
      },
      {
        sysId: 'menu-1',
        menuCd: 'MENU',
        menuNm: '메뉴 관리',
        parentMenuCd: 'SYS',
        ordNo: 1,
        treeLevel: 2,
        menuUrl: '/admin/system/menu',
      },
      {
        sysId: 'code-1',
        menuCd: 'COMMON_CODE',
        menuNm: '공통코드',
        parentMenuCd: 'SYS',
        ordNo: 2,
        treeLevel: 2,
        menuUrl: '/admin/system/common-code',
      },
    ]);
  });

  it('returns empty arrays when current tree equals original tree', () => {
    const tree = buildMenuTree(menus);
    const request = buildMenuRequest(tree, tree);

    expect(request).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
    expect(hasMenuChanges(request)).toBe(false);
  });

  it('splits new, updated, and deleted menu nodes into save request arrays', () => {
    const originalTree = buildMenuTree(menus);
    const currentTree: MenuNode[] = [
      {
        ...originalTree[0],
        children: [
          {
            ...originalTree[0].children![0],
            data: {
              ...originalTree[0].children![0].data!,
              name: '메뉴 관리 수정',
            },
          },
          {
            id: 'new-1',
            label: '',
            data: {
              code: 'NEW_MENU',
              name: '신규 메뉴',
              path: '/admin/new-menu',
              ordNo: 0,
              isNew: true,
            },
          },
        ],
      },
    ];

    const request = buildMenuRequest(currentTree, originalTree);

    expect(request.newItems).toEqual([
      {
        menuCd: 'NEW_MENU',
        menuNm: '신규 메뉴',
        parentMenuCd: 'SYS',
        ordNo: 2,
        treeLevel: 2,
        menuUrl: '/admin/new-menu',
      },
    ]);
    expect(request.updateItems).toEqual([
      {
        sysId: 'menu-1',
        menuCd: 'MENU',
        menuNm: '메뉴 관리 수정',
        parentMenuCd: 'SYS',
        ordNo: 1,
        treeLevel: 2,
        menuUrl: '/admin/system/menu',
      },
    ]);
    expect(request.delItems).toEqual([
      {
        sysId: 'code-1',
        menuCd: 'COMMON_CODE',
        menuNm: '공통코드',
        parentMenuCd: 'SYS',
        ordNo: 2,
        treeLevel: 2,
        menuUrl: '/admin/system/common-code',
      },
    ]);
    expect(hasMenuChanges(request)).toBe(true);
  });

  it('includes all removed descendants in delItems when deleting a parent node', () => {
    const originalTree = buildMenuTree(menus);
    const request = buildMenuRequest([], originalTree);

    expect(request.delItems?.map((item) => item.menuCd)).toEqual([
      'SYS',
      'MENU',
      'COMMON_CODE',
    ]);
  });

  it('marks saved new nodes as persisted so they are not sent as new again', () => {
    const currentTree: MenuNode[] = [
      {
        id: 'new-1',
        label: '',
        data: {
          code: 'NEW_MENU',
          name: '신규 메뉴',
          path: '/admin/new-menu',
          ordNo: 0,
          isNew: true,
        },
      },
    ];
    const persistedTree = markMenuNodesPersisted(currentTree);

    expect(persistedTree[0].data?.isNew).toBe(false);
    expect(buildMenuRequest(persistedTree, persistedTree)).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
  });
});
