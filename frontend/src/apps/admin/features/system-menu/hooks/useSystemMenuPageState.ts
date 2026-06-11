/**
 * @fileoverview 메뉴 관리 페이지 상태 조합 훅
 *
 * @description
 * - 서버 조회(useQuery)와 화면 편집 상태(nodes)를 한 곳에서 조합한다.
 * - 트리 조작 helper는 모듈 상단에 순수 함수로 분리한다.
 * - 저장 확인 흐름(requestSave → confirmSave)과 안내 모달(notice)을 관리한다.
 * - 초기화 dirty guard: 편집 중인 내용이 있으면 확인 후 초기화한다.
 * - 저장 전 삭제 항목 확인: 서버 로드된 노드가 삭제된 경우 목록을 보여주고 확인한다.
 * - depth 제한(MAX_MENU_DEPTH=4): 0~3depth만 하위 추가 가능. 4depth 이상 노드가 있으면
 *   저장을 막고, 필드 에러(보더)를 표시하며, 접혀 있던 조상 노드를 자동으로 펼쳐 보여준다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { findMenuByIdentity } from '@/apps/admin/features/sidebar/utils/adminMenuCatalogNav';
import { useAdminMenuCatalogQuery } from '@/shared/menu/useAdminMenuCatalogQuery';
import type { MenuData, MenuNode, NodeFieldErrors } from '../types';
import {
  buildMenuRequest,
  buildMenuTree,
  cloneMenuNodes,
  hasMenuChanges,
  markMenuNodesPersisted,
  useSaveMenuMutation,
} from '../api/systemMenuApi';

/* =====================================================
 * 트리 조작 helper — 순수 함수
 * ===================================================== */

/**
 * 특정 노드의 data를 갱신한다.
 * code 변경 시 label(aria 기준값)도 함께 동기화한다.
 */
function updateNodeData(nodes: MenuNode[], id: string, patch: Partial<MenuData>): MenuNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return {
        ...node,
        data: { ...node.data, ...patch } as MenuData,
        label: patch.code !== undefined ? patch.code || node.label : node.label,
      };
    }
    if (node.children?.length) {
      return { ...node, children: updateNodeData(node.children, id, patch) };
    }
    return node;
  });
}

/**
 * targetId 노드 바로 뒤에 newNode를 형제로 삽입한다.
 * 같은 부모의 같은 depth에만 삽입된다.
 */
function addSiblingNode(nodes: MenuNode[], targetId: string, newNode: MenuNode): MenuNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) {
    const next = [...nodes];
    next.splice(idx + 1, 0, newNode);
    return next;
  }
  return nodes.map((n) => ({
    ...n,
    children: n.children?.length ? addSiblingNode(n.children, targetId, newNode) : n.children,
  }));
}

/**
 * parentId 노드의 children 맨 끝에 child를 추가한다.
 */
function addChildNode(nodes: MenuNode[], parentId: string, child: MenuNode): MenuNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] };
    }
    if (node.children?.length) {
      return { ...node, children: addChildNode(node.children, parentId, child) };
    }
    return node;
  });
}

/**
 * 특정 노드(및 하위 전체)를 트리에서 제거한다.
 */
function removeNode(nodes: MenuNode[], id: string): MenuNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: n.children?.length ? removeNode(n.children, id) : n.children,
    }));
}

/**
 * 특정 id 노드를 트리에서 찾아 반환한다.
 */
function findNode(nodes: MenuNode[], id: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 특정 id 노드의 depth(0-based)를 반환한다. 찾지 못하면 -1.
 * - 0 → 0depth (루트, ADMIN/CLIENT), 1 → 1depth, …
 */
function getNodeDepth(nodes: MenuNode[], targetId: string, depth = 0): number {
  for (const node of nodes) {
    if (node.id === targetId) return depth;
    if (node.children?.length) {
      const found = getNodeDepth(node.children, targetId, depth + 1);
      if (found !== -1) return found;
    }
  }
  return -1;
}

/** 트리에서 허용되는 최대 depth(0-based). 이 값 이상이면 자식 추가/저장을 막는다. */
const MAX_MENU_DEPTH = 4;

/**
 * targetId 노드를 같은 부모 내에서 한 칸 위로 이동한다.
 * 이미 첫 번째이면 아무 것도 하지 않는다.
 */
function moveNodeUp(nodes: MenuNode[], targetId: string): MenuNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx > 0) {
    const next = [...nodes];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    return next;
  }
  if (idx === 0) return nodes;
  return nodes.map((n) => ({
    ...n,
    children: n.children?.length ? moveNodeUp(n.children, targetId) : n.children,
  }));
}

/**
 * targetId 노드를 같은 부모 내에서 한 칸 아래로 이동한다.
 * 이미 마지막이면 아무 것도 하지 않는다.
 */
function moveNodeDown(nodes: MenuNode[], targetId: string): MenuNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1 && idx < nodes.length - 1) {
    const next = [...nodes];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    return next;
  }
  if (idx === nodes.length - 1) return nodes;
  return nodes.map((n) => ({
    ...n,
    children: n.children?.length ? moveNodeDown(n.children, targetId) : n.children,
  }));
}

/**
 * targetId 노드가 같은 부모 내에서 위로 이동 가능한지 확인한다.
 */
function canNodeMoveUp(nodes: MenuNode[], targetId: string): boolean {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) return idx > 0;
  return nodes.some((n) => n.children?.length && canNodeMoveUp(n.children, targetId));
}

/**
 * targetId 노드가 같은 부모 내에서 아래로 이동 가능한지 확인한다.
 */
function canNodeMoveDown(nodes: MenuNode[], targetId: string): boolean {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) return idx < nodes.length - 1;
  return nodes.some((n) => n.children?.length && canNodeMoveDown(n.children, targetId));
}

/**
 * 자식이 있는 모든 노드 id를 수집한다 (defaultExpandedIds 초기화용).
 */
function collectExpandedIds(nodes: MenuNode[]): string[] {
  const ids: string[] = [];
  nodes.forEach((node) => {
    if (node.children?.length) {
      ids.push(node.id);
      ids.push(...collectExpandedIds(node.children));
    }
  });
  return ids;
}

/**
 * 트리 전체를 순회해 필드별 오류 노드 ID를 수집한다.
 * - code / name 이 비어 있는 노드
 * - 자식이 있는데 메뉴주소(path)가 설정된 노드 (부모+경로 충돌)
 */
function collectNodeErrors(nodes: MenuNode[]): NodeFieldErrors {
  const errors: NodeFieldErrors = {
    code: new Set<string>(),
    name: new Set<string>(),
    path: new Set<string>(),
    depth: new Set<string>(),
  };

  function traverse(list: MenuNode[], depth: number) {
    for (const node of list) {
      if (!node.data?.code?.trim()) errors.code.add(node.id);
      if (!node.data?.name?.trim()) errors.name.add(node.id);
      if (node.data?.path?.trim() && (node.children?.length ?? 0) > 0) {
        errors.path.add(node.id);
      }
      if (depth >= MAX_MENU_DEPTH) errors.depth.add(node.id);
      if (node.children?.length) traverse(node.children, depth + 1);
    }
  }
  traverse(nodes, 0);
  return errors;
}

/** 오류 없는 초기 NodeFieldErrors 객체를 생성한다. */
const emptyErrors = (): NodeFieldErrors => ({
  code: new Set<string>(),
  name: new Set<string>(),
  path: new Set<string>(),
  depth: new Set<string>(),
});

/**
 * targetIds에 해당하는 노드들의 조상 노드 id를 모두 수집한다.
 * 접혀 있는 트리에서도 오류 노드가 보이도록 펼칠 때 사용한다.
 */
function collectAncestorIds(nodes: MenuNode[], targetIds: Set<string>): string[] {
  const ancestorIds = new Set<string>();

  function traverse(list: MenuNode[], ancestors: string[]) {
    for (const node of list) {
      if (targetIds.has(node.id)) {
        ancestors.forEach((id) => ancestorIds.add(id));
      }
      if (node.children?.length) traverse(node.children, [...ancestors, node.id]);
    }
  }
  traverse(nodes, []);
  return [...ancestorIds];
}

/**
 * originalNodes 중 서버에서 로드된 노드(sysId 있음)가
 * current 트리에 없으면 삭제된 것으로 판단해 목록을 반환한다.
 */
function collectDeletedServerNodes(
  original: MenuNode[],
  current: MenuNode[],
): { code: string; name: string }[] {
  const currentIds = new Set<string>();
  function collectIds(nodes: MenuNode[]) {
    for (const node of nodes) {
      currentIds.add(node.id);
      if (node.children?.length) collectIds(node.children);
    }
  }
  collectIds(current);

  const deleted: { code: string; name: string }[] = [];
  function traverse(nodes: MenuNode[]) {
    for (const node of nodes) {
      if (node.data?.sysId && !currentIds.has(node.id)) {
        deleted.push({ code: node.data.code ?? '', name: node.data.name ?? '' });
      }
      if (node.children?.length) traverse(node.children);
    }
  }
  traverse(original);
  return deleted;
}

function createNewMenuNode(parentMenuCd?: string, ordNo = 0): MenuNode {
  const nodeId = `new-menu-${Date.now()}-${Math.random()}`;

  return {
    id: nodeId,
    label: '',
    data: {
      parentMenuCd,
      code: '',
      name: '',
      ordNo,
      isNew: true,
    },
  };
}

/* =====================================================
 * useSystemMenuPageState
 * ===================================================== */

export function useSystemMenuPageState() {
  const [nodes, setNodes] = useState<MenuNode[]>([]);
  /** 초기화 기준점 — 최초 로드 또는 마지막 저장 성공 시점의 데이터 */
  const [originalNodes, setOriginalNodes] = useState<MenuNode[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [defaultExpandedIds, setDefaultExpandedIds] = useState<string[]>([]);
  /** 증가할 때마다 TreeMenu를 강제 리마운트해 확장 상태를 초기화한다. */
  const [treeKey, setTreeKey] = useState(0);
  /**
   * 특정 노드들을 강제로 펼치는 신호 (하위추가 시 부모 노드, 저장 오류 시 오류 노드의 조상 노드).
   * n 카운터가 바뀌면 같은 ids라도 useEffect가 다시 발동한다.
   */
  const [expandTrigger, setExpandTrigger] = useState<{ ids: string[]; n: number } | null>(null);

  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description?: string;
    validationItems?: string[];
    onConfirm?: () => void;
  } | null>(null);
  const [nodeErrors, setNodeErrors] = useState<NodeFieldErrors>(emptyErrors);

  /** 초기화 dirty guard 확인 모달 */
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  /** 저장 전 삭제 목록 확인 모달 */
  const [deleteListConfirm, setDeleteListConfirm] = useState<{
    open: boolean;
    items: { code: string; name: string }[];
  }>({ open: false, items: [] });

  const hasInitialized = useRef(false);

  // 메뉴 카탈로그 쿼리가 관리자 메뉴의 단일 진실 원천이다.
  // 얇은 useMenuQuery 래퍼는 제거하고 공용 훅을 직접 사용한다.
  const menuQuery = useAdminMenuCatalogQuery();
  const saveMenuMutation = useSaveMenuMutation();

  const resetFromMenuRows = (
    menuRows: Parameters<typeof buildMenuTree>[0],
    selectedIdentity?: { sysId?: string; menuCd?: string; path?: string },
  ) => {
    const menuTree = buildMenuTree(menuRows);
    const cloned = cloneMenuNodes(menuTree);
    const matchedMenu = findMenuByIdentity(
      menuRows.map((menu) => ({
        sysId: menu.sysId,
        menuCd: menu.menuCd,
        menuNm: menu.menuNm,
        parentMenuCd: menu.parentMenuCd,
        path: menu.menuUrl ?? '',
        ordNo: Number(menu.ordNo) || 0,
        treeLevel: Number(menu.treeLevel) || 0,
      })),
      selectedIdentity,
    );

    setNodes(cloned);
    setOriginalNodes(cloneMenuNodes(menuTree));
    setDefaultExpandedIds(collectExpandedIds(menuTree));
    setSelectedId(matchedMenu?.sysId ?? matchedMenu?.menuCd ?? '');
  };

  /** 현재 편집 중인 내용이 originalNodes와 다르면 true */
  const isDirty = useMemo(
    () => JSON.stringify(nodes) !== JSON.stringify(originalNodes),
    [nodes, originalNodes],
  );

  const selectedNode = selectedId ? findNode(nodes, selectedId) : undefined;
  const selectedDepth = selectedId ? getNodeDepth(nodes, selectedId) : -1;
  const selectedNodeIdentity = useMemo(
    () => ({
      sysId: selectedNode?.data?.sysId,
      menuCd: selectedNode?.data?.code,
      path: selectedNode?.data?.path,
    }),
    [selectedNode?.data?.code, selectedNode?.data?.path, selectedNode?.data?.sysId],
  );

  /** 최초 로드 시 한 번만 nodes를 초기화하고, dirty하지 않을 때만 서버 최신값으로 동기화한다. */
  useEffect(() => {
    if (!menuQuery.data) {
      return;
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      resetFromMenuRows(menuQuery.data);
      return;
    }

    if (!isDirty) {
      resetFromMenuRows(menuQuery.data, selectedNodeIdentity);
    }
  }, [isDirty, menuQuery.data, selectedNodeIdentity]);

  /**
   * 하위 추가 가능 조건:
   * 1. 선택된 노드가 있을 것
   * 2. 메뉴주소(path)가 없을 것 (path 있으면 리프 노드로 간주)
   * 3. 최대 4depth(treeLevel 0~4)까지만 자식 추가 가능 — depth 0~3은 자식 추가 가능, depth 4(treeLevel 4)는 리프
   */
  const canAddChild = Boolean(
    selectedNode && !selectedNode.data?.path && selectedDepth < MAX_MENU_DEPTH,
  );
  const canDelete = Boolean(selectedId);
  const canMoveUp = Boolean(selectedId && canNodeMoveUp(nodes, selectedId));
  const canMoveDown = Boolean(selectedId && canNodeMoveDown(nodes, selectedId));

  const handleSelect = (id: string) => setSelectedId(id);

  const handleUpdateData = (id: string, patch: Partial<MenuData>) => {
    setNodes((prev) => updateNodeData(prev, id, patch));
    // 편집된 필드의 오류 상태를 즉시 해제한다.
    setNodeErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      if (patch.code !== undefined && prev.code.has(id)) {
        next.code = new Set(prev.code);
        next.code.delete(id);
        changed = true;
      }
      if (patch.name !== undefined && prev.name.has(id)) {
        next.name = new Set(prev.name);
        next.name.delete(id);
        changed = true;
      }
      if (patch.path !== undefined && prev.path.has(id)) {
        next.path = new Set(prev.path);
        next.path.delete(id);
        changed = true;
      }
      return changed ? next : prev;
    });
  };

  /**
   * 행추가: 선택된 노드가 있으면 같은 depth 바로 아래에 삽입한다.
   * 선택이 없으면 루트 레벨 맨 끝에 추가한다.
   */
  const handleAddSibling = () => {
    const newNode = createNewMenuNode(selectedNode?.data?.parentMenuCd);

    if (selectedId) {
      setNodes((prev) => addSiblingNode(prev, selectedId, newNode));
    } else {
      setNodes((prev) => [...prev, newNode]);
    }
    setSelectedId(newNode.id);
  };

  /**
   * 하위추가: 선택된 노드의 children 맨 끝에 새 노드를 추가한다.
   * path가 있는 노드(리프)는 하위 추가 불가.
   * 부모 노드가 접혀 있으면 자동으로 펼친다.
   */
  const handleAddChild = () => {
    // canAddChild가 비활성화 처리에서 풀리는 오류가 있더라도 depth 제한을 한 번 더 강제한다.
    if (!selectedId || !canAddChild || selectedDepth >= MAX_MENU_DEPTH) return;
    const newNode = createNewMenuNode(
      selectedNode?.data?.code,
      (selectedNode?.children?.length ?? 0) + 1,
    );
    setNodes((prev) => addChildNode(prev, selectedId, newNode));
    setSelectedId(newNode.id);
    // 부모 노드 하나만 펼치는 신호를 보낸다. n 증가로 이미 목록에 있어도 반드시 발동.
    setExpandTrigger((prev) => ({ ids: [selectedId], n: (prev?.n ?? 0) + 1 }));
  };

  /** 행삭제: 선택된 노드와 하위 전체를 제거한다. */
  const handleDelete = () => {
    if (!selectedId) return;
    setNodes((prev) => removeNode(prev, selectedId));
    setSelectedId('');
  };

  /** 위로 이동: 같은 부모 내에서 한 칸 위로. */
  const handleMoveUp = () => {
    if (!selectedId) return;
    setNodes((prev) => moveNodeUp(prev, selectedId));
  };

  /** 아래로 이동: 같은 부모 내에서 한 칸 아래로. */
  const handleMoveDown = () => {
    if (!selectedId) return;
    setNodes((prev) => moveNodeDown(prev, selectedId));
  };

  /** 실제 초기화 로직 — dirty 확인 후 호출된다. */
  const doReset = () => {
    setNodes(cloneMenuNodes(originalNodes));
    setSelectedId('');
    setNodeErrors(emptyErrors());
    // 최초 로드 시와 동일하게 전체 접힌 상태로 되돌린다.
    setDefaultExpandedIds([]);
    // 남아있는 펼침 신호가 리마운트 후 다시 적용되어 일부만 펼쳐지는 것을 방지한다.
    setExpandTrigger(null);
    setTreeKey((prev) => prev + 1);
  };

  /**
   * 초기화 요청: 편집 중인 내용이 있으면 확인 모달을 열고, 없으면 즉시 초기화한다.
   */
  const requestReset = () => {
    if (isDirty) {
      setIsResetConfirmOpen(true);
    } else {
      doReset();
    }
  };

  const confirmReset = () => {
    setIsResetConfirmOpen(false);
    doReset();
  };

  const closeResetConfirm = () => setIsResetConfirmOpen(false);

  const requestSave = () => {
    const errors = collectNodeErrors(nodes);
    const hasEmpty = errors.code.size > 0 || errors.name.size > 0;
    const hasPathConflict = errors.path.size > 0;
    const hasDepthExceeded = errors.depth.size > 0;

    if (hasEmpty || hasPathConflict || hasDepthExceeded) {
      const messages: string[] = [];
      if (hasEmpty) messages.push('빈값을 채워주세요.');
      if (hasPathConflict) messages.push('하위 메뉴가 있는 항목은 메뉴주소를 비워주세요.');
      if (hasDepthExceeded) {
        messages.push('최대 depth를 초과한 메뉴가 있습니다.\n트리 구조를 수정한 후 다시 시도해주세요.');
      }
      const errorIds = new Set([
        ...errors.code,
        ...errors.name,
        ...errors.path,
        ...errors.depth,
      ]);
      const ancestorIds = collectAncestorIds(nodes, errorIds);

      setNotice({
        title: '알림',
        validationItems: messages,
        onConfirm: () => {
          setNodeErrors(errors);
          if (ancestorIds.length > 0) {
            setExpandTrigger((prev) => ({ ids: ancestorIds, n: (prev?.n ?? 0) + 1 }));
          }
          setNotice(null);
        },
      });
      return;
    }

    setNodeErrors(emptyErrors());

    // 서버에서 로드된 노드 중 삭제된 항목이 있으면 먼저 목록 확인
    const deletedItems = collectDeletedServerNodes(originalNodes, nodes);
    if (deletedItems.length > 0) {
      setDeleteListConfirm({ open: true, items: deletedItems });
      return;
    }

    if (!isDirty) {
      setNotice({ title: '알림', description: '변경된 내용이 없습니다.' });
      return;
    }

    const request = buildMenuRequest(nodes, originalNodes);

    if (!hasMenuChanges(request)) {
      setNotice({ title: '알림', description: '변경된 내용이 없습니다.' });
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const closeDeleteListConfirm = () => {
    setDeleteListConfirm({ open: false, items: [] });
  };

  /** 실제 저장 실행 — SaveConfirmModal과 DeleteListConfirmModal 양쪽에서 공유 */
  const executeSave = async (closeModal: () => void) => {
    setIsConfirming(true);
    try {
      const request = buildMenuRequest(nodes, originalNodes);
      await saveMenuMutation.mutateAsync(request);
      const refetchResult = await menuQuery.refetch();
      if (refetchResult.data) {
        resetFromMenuRows(refetchResult.data, selectedNodeIdentity);
      } else {
        const persistedNodes = markMenuNodesPersisted(nodes);
        setNodes(cloneMenuNodes(persistedNodes));
        setOriginalNodes(cloneMenuNodes(persistedNodes));
      }
      closeModal();
      setNotice({ title: '알림', description: '저장되었습니다.' });
    } catch {
      closeModal();
      setNotice({ title: '알림', description: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsConfirming(false);
    }
  };

  /** 삭제 목록 확인 모달에서 확인 → 바로 저장 (SaveConfirmModal 없이) */
  const confirmDeleteListAndSave = () => {
    executeSave(() => setDeleteListConfirm({ open: false, items: [] }));
  };

  const confirmSave = () => {
    executeSave(() => setIsSaveConfirmOpen(false));
  };

  const closeSaveConfirm = () => setIsSaveConfirmOpen(false);
  const closeNotice = () => setNotice(null);
  const confirmNotice = () => {
    if (notice?.onConfirm) {
      notice.onConfirm();
      return;
    }

    setNotice(null);
  };

  return {
    data: { nodes },
    status: {
      isLoading: menuQuery.isLoading,
      isError: menuQuery.isError,
      isSaving: isConfirming,
    },
    actions: {
      handleSelect,
      handleUpdateData,
      handleAddSibling,
      handleAddChild,
      handleDelete,
      handleMoveUp,
      handleMoveDown,
      handleReset: requestReset,
      confirmReset,
      closeResetConfirm,
      requestSave,
      confirmDeleteListAndSave,
      closeDeleteListConfirm,
      confirmSave,
      closeSaveConfirm,
      closeNotice,
      confirmNotice,
    },
    uiProps: {
      selectedId,
      canAddChild,
      canDelete,
      canMoveUp,
      canMoveDown,
      isSaveConfirmOpen,
      isConfirming,
      notice,
      defaultExpandedIds,
      expandTrigger,
      nodeErrors,
      treeKey,
      isResetConfirmOpen,
      deleteListConfirm,
    },
  };
}
