/**
 * @fileoverview 메뉴 관리 페이지 상태 조합 훅
 *
 * @description
 * - 서버 조회(useQuery)와 화면 편집 상태(nodes)를 한 곳에서 조합한다.
 * - 트리 조작 helper는 모듈 상단에 순수 함수로 분리한다.
 * - 저장 확인 흐름(requestSave → confirmSave)과 안내 모달(notice)을 관리한다.
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MenuData, MenuNode, NodeFieldErrors } from '../types';
import { fetchMenuTree, saveMenuTree } from '../api/systemMenuApi';


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
        label: patch.code !== undefined ? (patch.code || node.label) : node.label,
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
 * - 0 → 1depth (루트), 1 → 2depth, …
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
  };

  function traverse(list: MenuNode[]) {
    for (const node of list) {
      if (!node.data?.code?.trim()) errors.code.add(node.id);
      if (!node.data?.name?.trim()) errors.name.add(node.id);
      if (node.data?.path?.trim() && (node.children?.length ?? 0) > 0) {
        errors.path.add(node.id);
      }
      if (node.children?.length) traverse(node.children);
    }
  }
  traverse(nodes);
  return errors;
}

/** 오류 없는 초기 NodeFieldErrors 객체를 생성한다. */
const emptyErrors = (): NodeFieldErrors => ({
  code: new Set<string>(),
  name: new Set<string>(),
  path: new Set<string>(),
});


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
   * 하위추가 시 부모 노드 하나만 정확히 펼치는 신호.
   * n 카운터가 바뀌면 같은 id라도 useEffect가 다시 발동한다.
   */
  const [expandTrigger, setExpandTrigger] = useState<{ id: string; n: number } | null>(null);

  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState<{ title: string; description?: string } | null>(null);
  const [nodeErrors, setNodeErrors] = useState<NodeFieldErrors>(emptyErrors);

  const hasInitialized = useRef(false);

  const menuQuery = useQuery({
    queryKey: ['system-menu'],
    queryFn: fetchMenuTree,
  });

  /** 최초 로드 시 한 번만 nodes를 초기화한다. 편집 중인 내용을 query 갱신으로 덮지 않는다. */
  useEffect(() => {
    if (menuQuery.data && !hasInitialized.current) {
      hasInitialized.current = true;
      const cloned = structuredClone(menuQuery.data);
      setNodes(cloned);
      setOriginalNodes(structuredClone(menuQuery.data));
      setDefaultExpandedIds(collectExpandedIds(menuQuery.data));
    }
  }, [menuQuery.data]);

  const selectedNode = selectedId ? findNode(nodes, selectedId) : undefined;
  const selectedDepth = selectedId ? getNodeDepth(nodes, selectedId) : -1;

  /**
   * 하위 추가 가능 조건:
   * 1. 선택된 노드가 있을 것
   * 2. 메뉴주소(path)가 없을 것 (path 있으면 리프 노드로 간주)
   * 3. 최대 5단계(depth 0~3)까지만 자식 추가 가능 — depth 4(5depth)는 리프
   */
  const canAddChild = Boolean(
    selectedNode && !selectedNode.data?.path && selectedDepth < 4,
  );
  const canDelete   = Boolean(selectedId);
  const canMoveUp   = Boolean(selectedId && canNodeMoveUp(nodes, selectedId));
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
    const newNode: MenuNode = {
      id: `new-${Date.now()}`,
      label: '',
      data: {
        parentSysId: selectedNode?.data?.parentSysId ?? null,
        code: '',
        name: '',
        ordNo: 0,
        isNew: true,
      },
    };

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
    if (!selectedId || !canAddChild) return;
    const newNode: MenuNode = {
      id: `new-${Date.now()}`,
      label: '',
      data: {
        parentSysId: selectedNode?.data?.sysId,
        code: '',
        name: '',
        ordNo: (selectedNode?.children?.length ?? 0) + 1,
        isNew: true,
      },
    };
    setNodes((prev) => addChildNode(prev, selectedId, newNode));
    setSelectedId(newNode.id);
    // 부모 노드 하나만 펼치는 신호를 보낸다. n 증가로 이미 목록에 있어도 반드시 발동.
    setExpandTrigger((prev) => ({ id: selectedId, n: (prev?.n ?? 0) + 1 }));
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

  /**
   * 초기화: 최초 로드(또는 마지막 저장 성공) 시점의 데이터로 되돌린다.
   * treeKey 증가로 TreeMenu를 강제 리마운트해 확장 상태도 초기화한다.
   */
  const handleReset = () => {
    setNodes(structuredClone(originalNodes));
    setSelectedId('');
    setNodeErrors(emptyErrors());
    setDefaultExpandedIds(collectExpandedIds(originalNodes));
    setTreeKey((prev) => prev + 1);
  };

  const requestSave = () => {
    const errors = collectNodeErrors(nodes);
    const hasEmpty = errors.code.size > 0 || errors.name.size > 0;
    const hasPathConflict = errors.path.size > 0;

    if (hasEmpty || hasPathConflict) {
      setNodeErrors(errors);
      const messages: string[] = [];
      if (hasEmpty) messages.push('메뉴코드와 메뉴 명은 필수 입력 항목입니다.');
      if (hasPathConflict) messages.push('하위 메뉴가 있는 항목에는 메뉴주소를 입력할 수 없습니다.');
      setNotice({ title: '입력 오류', description: messages.join('\n') });
      return;
    }

    setNodeErrors(emptyErrors());
    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    setIsConfirming(true);
    try {
      await saveMenuTree(nodes);
      // 저장 성공 시 원본 데이터를 현재 상태로 갱신한다 (초기화 기준점 업데이트).
      setOriginalNodes(structuredClone(nodes));
      setIsSaveConfirmOpen(false);
      setNotice({ title: '저장 완료', description: '메뉴 정보가 저장되었습니다.' });
    } catch {
      setIsSaveConfirmOpen(false);
      setNotice({ title: '저장 실패', description: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsConfirming(false);
    }
  };

  const closeSaveConfirm = () => setIsSaveConfirmOpen(false);
  const closeNotice = () => setNotice(null);

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
      handleReset,
      requestSave,
      confirmSave,
      closeSaveConfirm,
      closeNotice,
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
    },
  };
}
