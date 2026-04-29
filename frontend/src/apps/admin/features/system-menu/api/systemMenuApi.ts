/**
 * @fileoverview 메뉴 관리 feature의 서버 연동 계층
 *
 * @description
 * generated API를 화면에서 바로 사용하지 않고, 트리 화면 모델과 서버 DTO 사이의 변환을
 * 이 파일에서 전담한다. 메뉴는 트리 UI지만 서버 저장 계약은 평평한 Menu[] 배열이므로
 * 조회 시에는 배열을 트리로 만들고, 저장 시에는 트리를 다시 배열로 펼친다.
 */

import { useSaveMenu } from '@/generated/settings-controller/settings-controller';
import type { Menu } from '@/generated/types/menu';
import type { MenuRequest } from '@/generated/types/menuRequest';
import type { MenuNode } from '../types';

type MenuSaveItem = Omit<Menu, 'ordNo' | 'treeLevel'> & {
  ordNo: number;
  treeLevel: number;
};

type MenuSaveRequest = {
  newItems?: MenuSaveItem[];
  updateItems?: MenuSaveItem[];
  delItems?: MenuSaveItem[];
};

/**
 * 루트 메뉴의 parentMenuCd 계약값.
 *
 * @description
 * 백엔드 Menu.parentMenuCd가 @NotBlank라 루트도 빈 문자열로 보낼 수 없다.
 * 실제 DB/백엔드 계약이 다르면 이 상수만 교체한다.
 */
export const ROOT_PARENT_MENU_CD = 'ROOT';
const ROOT_TREE_DEPTH = 0;

function cloneMenuNode(node: MenuNode): MenuNode {
  return {
    ...node,
    data: node.data ? { ...node.data } : undefined,
    children: node.children?.map(cloneMenuNode),
  };
}

function sortMenuNodes(nodes: MenuNode[]) {
  return [...nodes].sort((a, b) => (a.data?.ordNo ?? 0) - (b.data?.ordNo ?? 0));
}

export function mapToMenuNode(menu: Menu): MenuNode {
  return {
    id: menu.sysId ?? menu.menuCd,
    label: menu.menuCd,
    data: {
      sysId: menu.sysId,
      parentMenuCd: menu.parentMenuCd,
      code: menu.menuCd,
      name: menu.menuNm,
      path: menu.menuUrl ?? '',
      ordNo: Number(menu.ordNo) || 0,
      treeLevel: Number(menu.treeLevel) || 0,
      isNew: false,
    },
  };
}

/**
 * Menu[] 배열을 MenuNode 트리로 변환하는 함수
 */
export function buildMenuTree(menus: Menu[]): MenuNode[] {
  const nodeByMenuCd = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  menus.forEach((menu) => {
    nodeByMenuCd.set(menu.menuCd, mapToMenuNode(menu));
  });

  menus.forEach((menu) => {
    const node = nodeByMenuCd.get(menu.menuCd);
    if (!node) return;

    const parentMenuCd = menu.parentMenuCd;
    const parentNode = parentMenuCd ? nodeByMenuCd.get(parentMenuCd) : undefined;

    if (!parentNode || parentMenuCd === ROOT_PARENT_MENU_CD) {
      roots.push(node);
      return;
    }

    parentNode.children = [...(parentNode.children ?? []), node];
  });

  function sortChildren(nodes: MenuNode[]): MenuNode[] {
    return sortMenuNodes(nodes).map((node) => ({
      ...node,
      children: node.children?.length ? sortChildren(node.children) : undefined,
    }));
  }

  return sortChildren(roots);
}

type FlattenedMenuNode = {
  node: MenuNode;
  parentMenuCd: string;
  ordNo: number;
  treeLevel: number;
};

type MenuPayloadContext = {
  flattenedNodes: FlattenedMenuNode[];
  menus: MenuSaveItem[];
  menuBySysId: Map<string, MenuSaveItem>;
  nodeBySysId: Map<string, MenuNode>;
};

/**
 * MenuNode 트리를 MenuSaveItem 배열로 변환하기 위해 트리를 평탄화하는 함수
 * - 각 노드에 부모 메뉴 코드, 순서 번호, 트리 레벨 정보를 함께 포함
 * - 평탄화된 배열은 트리를 다시 구성하거나 서버에 저장할 때 사용
 */
export function flattenMenuNodes(nodes: MenuNode[]): FlattenedMenuNode[] {
  const result: FlattenedMenuNode[] = [];

  /**
   * 재귀적으로 트리를 순회하며 각 노드를 평탄화된 형태로 result 배열에 추가하는 내부 함수
   * @param list 현재 순회 중인 노드 리스트
   * @param parentMenuCd 부모 메뉴 코드 (루트 노드의 경우 ROOT_PARENT_MENU_CD)
   * @param depth 현재 트리 깊이 (루트 노드의 경우 0)
   */
  function visit(list: MenuNode[], parentMenuCd: string, depth: number) {
    list.forEach((node, index) => {
      const menuCd = node.data?.code ?? '';
      const flattened = {
        node,
        parentMenuCd,
        ordNo: index + 1,
        treeLevel: depth + 1,
      };

      result.push(flattened);

      if (node.children?.length) {
        visit(node.children, menuCd || ROOT_PARENT_MENU_CD, depth + 1);
      }
    });
  }

  visit(nodes, ROOT_PARENT_MENU_CD, ROOT_TREE_DEPTH);

  return result;
}

/**
 * FlattenedMenuNode를 MenuSaveItem으로 변환하는 함수
 */
export function mapToMenuPayload(flattened: FlattenedMenuNode): MenuSaveItem {
  const { node, parentMenuCd, ordNo, treeLevel } = flattened;

  return {
    sysId: node.data?.sysId,
    menuCd: node.data?.code ?? '',
    menuNm: node.data?.name ?? '',
    parentMenuCd,
    ordNo,
    treeLevel,
    menuUrl: node.data?.path?.trim() ? node.data.path : undefined,
  };
}

/**
 * 두 MenuSaveItem이 동일한지 비교하는 함수
 * - sysId가 존재하는 경우 sysId로 비교
 * - sysId가 없는 경우 menuCd, menuNm, parentMenuCd, ordNo, treeLevel, menuUrl을 비교
 * - 메뉴 URL은 null/undefined와 빈 문자열을 동일하게 취급
 * - 이 함수는 메뉴가 변경되었는지 판단하는 데 사용되며, 변경되지 않은 메뉴는 업데이트 요청에서 제외하여 불필요한 서버 연동을 방지하는 데 활용
 */
function isSameMenu(a: MenuSaveItem, b: MenuSaveItem) {
  return (
    a.menuCd === b.menuCd &&
    a.menuNm === b.menuNm &&
    a.parentMenuCd === b.parentMenuCd &&
    a.ordNo === b.ordNo &&
    a.treeLevel === b.treeLevel &&
    (a.menuUrl ?? '') === (b.menuUrl ?? '')
  );
}

/**
 * Menu[] 배열을 MenuNode 트리로 변환하는 함수
 */
function buildMenuPayloadContext(nodes: MenuNode[]): MenuPayloadContext {
  const flattenedNodes = flattenMenuNodes(nodes);
  const menus = flattenedNodes.map(mapToMenuPayload);

  return {
    flattenedNodes,
    menus,
    menuBySysId: new Map(
      menus.filter((menu) => menu.sysId).map((menu) => [menu.sysId as string, menu]),
    ),
    nodeBySysId: new Map(
      flattenedNodes
        .filter((item) => item.node.data?.sysId)
        .map((item) => [item.node.data?.sysId as string, item.node]),
    ),
  };
}

/**
 * MenuNode 트리를 MenuSaveRequest로 변환하는 함수
 *
 * * - 이 함수는 메뉴 관리 화면에서 사용자가 메뉴를 추가, 수정, 삭제한 후 저장할 때 호출되어 변경 사항을 서버에 전달하는 역할을 한다.
 * - 현재 노드 트리와 원본 노드 트리를 비교하여 새로 추가된 메뉴, 수정된 메뉴, 삭제된 메뉴를 구분
 * - 새로 추가된 메뉴는 current 트리에 존재하지만 original 트리에 없는 메뉴로 판단
 * - 수정된 메뉴는 sysId가 존재하고 original 트리에 존재하지만, menuCd, menuNm, parentMenuCd, ordNo, treeLevel, menuUrl 중 하나라도 다른 메뉴로 판단
 * - 삭제된 메뉴는 original 트리에 존재하지만 current 트리에 없는 메뉴로 판단
 * - 반환된 MenuSaveRequest는 서버에 저장할 때 사용되며, 변경된 메뉴만 포함하여 불필요한 데이터 전송을 줄이는 데 활용
 *
 * @returns MenuSaveRequest 객체로, newItems, updateItems, delItems 배열을 포함하여 변경된 메뉴 정보를 담고 있다.
 */
export function buildMenuRequest(
  currentNodes: MenuNode[],
  originalNodes: MenuNode[],
): MenuSaveRequest {
  const current = buildMenuPayloadContext(currentNodes);
  const original = buildMenuPayloadContext(originalNodes);

  const newItems = current.flattenedNodes
    .filter((item) => item.node.data?.isNew === true)
    .map(mapToMenuPayload);
  const updateItems = current.menus
    .filter((menu) => menu.sysId)
    .filter((menu) => {
      const currentNode = current.nodeBySysId.get(menu.sysId as string);
      if (currentNode?.data?.isNew) return false;

      const originalMenu = original.menuBySysId.get(menu.sysId as string);
      return originalMenu ? !isSameMenu(menu, originalMenu) : false;
    });
  const delItems = original.menus.filter(
    (menu) => menu.sysId && !current.menuBySysId.has(menu.sysId as string),
  );

  return {
    newItems,
    updateItems,
    delItems,
  };
}

export function hasMenuChanges(request: MenuSaveRequest) {
  return Boolean(
    request.newItems?.length || request.updateItems?.length || request.delItems?.length,
  );
}

export function useSaveMenuMutation() {
  const mutation = useSaveMenu();

  return {
    mutateAsync: async (request: MenuSaveRequest) =>
      mutation.mutateAsync({ data: request as unknown as MenuRequest }),
    isPending: mutation.isPending,
  };
}

export function cloneMenuNodes(nodes: MenuNode[]) {
  return nodes.map(cloneMenuNode);
}

export function markMenuNodesPersisted(nodes: MenuNode[]): MenuNode[] {
  return nodes.map((node) => ({
    ...node,
    data: node.data
      ? {
          ...node.data,
          isNew: false,
        }
      : undefined,
    children: node.children?.length ? markMenuNodesPersisted(node.children) : undefined,
  }));
}
