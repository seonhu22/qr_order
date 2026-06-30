import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  buildTableGuiRequest,
  hasTableGuiChanges,
  isTableGuiPlaced,
  mapToPlacedTableItem,
  useSaveTableGuiMutation,
  useTableGuiQuery,
} from '../api/tableLayoutApi';
import { FACILITY_RESIZE_LIMITS, TABLE_LAYOUT_CANVAS_SIZE, TABLE_SIZE_PX } from '../constants';
import { snapPositionToNearbyItems } from '../utils';
import type { DraggedItemData, LayoutSize, PlacedFacilityItem, PlacedItem, PlacedTableItem } from '../types';
import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';

type SaveNoticeState = { title: string; description: string } | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function clonePlacedItems(items: PlacedItem[]) {
  return items.map((item) => ({ ...item }));
}

export function useTableLayoutPage(layoutSize: LayoutSize) {
  const queryClient = useQueryClient();
  const tableGuiQuery = useTableGuiQuery();
  const saveTableGuiMutation = useSaveTableGuiMutation();

  const eligibleTables = useMemo<TableGuiResponse[]>(() => tableGuiQuery.data ?? [], [tableGuiQuery.data]);
  const baseTableItems = useMemo(
    () => eligibleTables.filter(isTableGuiPlaced).map(mapToPlacedTableItem),
    [eligibleTables],
  );

  const [baseItems, setBaseItems] = useState<PlacedTableItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [activeDragData, setActiveDragData] = useState<DraggedItemData | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<SaveNoticeState>(null);

  useEffect(() => {
    setBaseItems(clonePlacedItems(baseTableItems) as PlacedTableItem[]);
    setPlacedItems((prev) => {
      const facilities = prev.filter((item) => item.kind !== 'table');
      return [...clonePlacedItems(baseTableItems), ...facilities];
    });
    // 서버 데이터가 바뀔 때만 동기화한다. 시설은 영속화 대상이 아니라서 유지한다.
  }, [baseTableItems]);

  const canvasNodeRef = useRef<HTMLElement | null>(null);
  const setCanvasNode = useCallback((node: HTMLElement | null) => {
    canvasNodeRef.current = node;
  }, []);

  const canvasScrollNodeRef = useRef<HTMLElement | null>(null);
  const setCanvasScrollNode = useCallback((node: HTMLElement | null) => {
    canvasScrollNodeRef.current = node;
  }, []);

  // "전체 보기" — 고정 크기 캔버스가 보이는 영역보다 클 때, 전체를 한눈에 보도록 축소해서 보여준다.
  // 축소된 상태에서 드래그하면 좌표가 축소 비율만큼 어긋나 저장 데이터가 꼬일 수 있어 보기 전용으로만 쓴다
  // (편집은 다시 눌러 원래 크기로 돌아온 뒤 한다).
  const [isFitToScreen, setIsFitToScreen] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  const recomputeCanvasScale = useCallback(() => {
    const scrollNode = canvasScrollNodeRef.current;
    if (!scrollNode) return;
    const scaleX = scrollNode.clientWidth / TABLE_LAYOUT_CANVAS_SIZE.width;
    const scaleY = scrollNode.clientHeight / TABLE_LAYOUT_CANVAS_SIZE.height;
    setCanvasScale(Math.min(scaleX, scaleY, 1));
  }, []);

  const toggleFitToScreen = useCallback(() => {
    setIsFitToScreen((prev) => {
      const next = !prev;
      if (!next) setCanvasScale(1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isFitToScreen) return;
    const scrollNode = canvasScrollNodeRef.current;
    if (!scrollNode) return;

    recomputeCanvasScale();
    const resizeObserver = new ResizeObserver(recomputeCanvasScale);
    resizeObserver.observe(scrollNode);
    return () => resizeObserver.disconnect();
  }, [isFitToScreen, recomputeCanvasScale]);

  const draftTableItems = useMemo(
    () => placedItems.filter((item): item is PlacedTableItem => item.kind === 'table'),
    [placedItems],
  );

  const isDirty = useMemo(() => {
    const request = buildTableGuiRequest(draftTableItems, baseItems);
    return hasTableGuiChanges(request);
  }, [draftTableItems, baseItems]);

  usePreventLeave(isDirty);

  const placedTableSysIds = useMemo(
    () => new Set(draftTableItems.filter((item) => item.sysId).map((item) => item.sysId as string)),
    [draftTableItems],
  );

  const handleDragStart = useCallback((data: DraggedItemData) => {
    setActiveDragData(data);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);

    const canvasNode = canvasNodeRef.current;
    const data = event.active.data.current as DraggedItemData | undefined;
    if (!canvasNode || !data) return;

    const draggedRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
    if (!draggedRect) return;

    const canvasRect = canvasNode.getBoundingClientRect();
    const width = draggedRect.width;
    const height = draggedRect.height;
    const x = clamp(draggedRect.left - canvasRect.left, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
    const y = clamp(draggedRect.top - canvasRect.top, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);

    if (data.origin === 'placed') {
      // dnd-kit이 드래그 종료 시 라이브 드래그용 transform을 먼저 지우고 나서야 이 콜백이 실행되다 보니,
      // setPlacedItems가 비동기로 반영되면 "원래 자리로 잠깐 복귀했다가 새 위치로 점프"하는 깜빡임이 보인다.
      // flushSync로 동기 반영해 같은 화면 갱신 안에서 한 번에 끝나게 한다.
      flushSync(() => {
        setPlacedItems((prev) => {
          const otherItems = prev.filter((item) => item.id !== data.id);
          const snapped = snapPositionToNearbyItems({ x, y, width, height }, otherItems);
          const snappedX = clamp(snapped.x, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
          const snappedY = clamp(snapped.y, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);
          return prev.map((item) =>
            item.id === data.id ? { ...item, x: snappedX, y: snappedY, width, height } : item,
          );
        });
      });
      return;
    }

    if (data.origin === 'facility-catalog') {
      flushSync(() => {
        setPlacedItems((prev) => {
          const snapped = snapPositionToNearbyItems({ x, y, width, height }, prev);
          const snappedX = clamp(snapped.x, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
          const snappedY = clamp(snapped.y, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);
          const newFacility: PlacedFacilityItem = {
            id: `facility-${data.kind}-${Date.now()}`,
            kind: data.kind,
            x: snappedX,
            y: snappedY,
            width,
            height,
          };
          return [...prev, newFacility];
        });
      });
    }
  }, []);

  const handlePlaceTable = useCallback(
    (table: TableGuiResponse) => {
      const canvasNode = canvasNodeRef.current;
      // 전체 보기로 캔버스가 축소된 상태에서는 스크롤 좌표가 축소 비율만큼 어긋나므로 배치를 막는다.
      if (!canvasNode || isFitToScreen || !table.sysId || placedTableSysIds.has(table.sysId)) return;

      const { width, height } = TABLE_SIZE_PX[layoutSize];
      // 캔버스가 고정 크기라 화면보다 클 수 있다 — 캔버스 전체의 중앙이 아니라, 지금 스크롤해서 보고 있는
      // 영역의 좌상단 기준으로 배치해야 클릭 직후 바로 보인다(스크롤된 곳이 아니면 화면 밖에 놓일 수 있음).
      const scrollNode = canvasScrollNodeRef.current;
      const visibleMargin = 24;
      const visibleLeft = scrollNode?.scrollLeft ?? 0;
      const visibleTop = scrollNode?.scrollTop ?? 0;
      const x = clamp(visibleLeft + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
      const y = clamp(visibleTop + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);

      const newTableItem: PlacedTableItem = {
        id: table.sysId,
        kind: 'table',
        sysId: table.sysId,
        tableNum: table.tableNum != null ? String(table.tableNum) : '',
        tableName: table.tableName ?? '',
        seatCount: table.tableQty ?? 0,
        x,
        y,
        width,
        height,
      };
      setPlacedItems((prev) => [...prev, newTableItem]);
    },
    [layoutSize, placedTableSysIds, isFitToScreen],
  );

  const handleResizeFacility = useCallback((id: string, width: number, height: number) => {
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.kind === 'table') return item;

        const nextWidth = clamp(
          width,
          FACILITY_RESIZE_LIMITS.minWidth,
          Math.min(FACILITY_RESIZE_LIMITS.maxWidth, TABLE_LAYOUT_CANVAS_SIZE.width - item.x),
        );
        const nextHeight = clamp(
          height,
          FACILITY_RESIZE_LIMITS.minHeight,
          Math.min(FACILITY_RESIZE_LIMITS.maxHeight, TABLE_LAYOUT_CANVAS_SIZE.height - item.y),
        );
        return { ...item, width: nextWidth, height: nextHeight };
      }),
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 되돌리기/전체 비우기 둘 다 캔버스에 즉시 반영되는 로컬 state 조작이라(저장만 API를 부른다),
  // 효과가 바로 눈에 보여 완료 안내 단계 없이 확인 → 즉시 반영 2단계로 끝낸다.
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  const requestReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    setPlacedItems(clonePlacedItems(baseItems));
    setIsResetConfirmOpen(false);
  }, [baseItems]);

  const closeResetConfirm = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const requestClearAll = useCallback(() => {
    setIsClearAllConfirmOpen(true);
  }, []);

  const confirmClearAll = useCallback(() => {
    setPlacedItems([]);
    setIsClearAllConfirmOpen(false);
  }, []);

  const closeClearAllConfirm = useCallback(() => {
    setIsClearAllConfirmOpen(false);
  }, []);

  const requestSave = useCallback(() => {
    if (isDirty) {
      setIsSaveConfirmOpen(true);
      return;
    }
    // 내부시설은 저장 대상이 아니다(ADR-015) — 테이블 변경 없이 내부시설만 배치한 채로 저장을 누르면
    // isDirty가 false라 조용히 아무 일도 안 일어나 보였다. 그 경우는 이유를 안내한다.
    const hasOnlyFacilityChanges = placedItems.some((item) => item.kind !== 'table');
    if (hasOnlyFacilityChanges) {
      setSaveNotice({
        title: '안내',
        description: '내부시설만 저장되지 않습니다.\n테이블을 배치한 뒤 다시 저장해 주세요.',
      });
    }
  }, [isDirty, placedItems]);

  const closeSaveConfirm = useCallback(() => {
    setIsSaveConfirmOpen(false);
  }, []);

  const closeSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  // 저장은 실제 API를 부르는 동작이라(되돌리기/전체 비우기와 달리), 성공해도 화면이 바뀌지 않아 결과를
  // 안내해야 한다 — async-patterns.md §1의 noticeState 패턴을 그대로 따른다.
  const confirmSave = useCallback(async () => {
    const request = buildTableGuiRequest(draftTableItems, baseItems);
    if (!hasTableGuiChanges(request)) {
      setIsSaveConfirmOpen(false);
      return;
    }
    try {
      await saveTableGuiMutation.mutateAsync(request);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tableLayout.lists });
      setIsSaveConfirmOpen(false);
      setSaveNotice({ title: '안내', description: '저장되었습니다.' });
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setSaveNotice({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    }
  }, [draftTableItems, baseItems, saveTableGuiMutation, queryClient]);

  return {
    placedItems,
    eligibleTables,
    placedTableSysIds,
    activeDragData,
    isDirty,
    isSaveConfirmOpen,
    saveNotice,
    isResetConfirmOpen,
    isClearAllConfirmOpen,
    isFitToScreen,
    canvasScale,
    isLoading: tableGuiQuery.isLoading,
    isError: tableGuiQuery.isError,
    isSaving: saveTableGuiMutation.isPending,
    setCanvasNode,
    setCanvasScrollNode,
    toggleFitToScreen,
    handleDragStart,
    handleDragEnd,
    handlePlaceTable,
    handleResizeFacility,
    handleRemoveItem,
    requestReset,
    confirmReset,
    closeResetConfirm,
    requestClearAll,
    confirmClearAll,
    closeClearAllConfirm,
    requestSave,
    confirmSave,
    closeSaveConfirm,
    closeSaveNotice,
  };
}
