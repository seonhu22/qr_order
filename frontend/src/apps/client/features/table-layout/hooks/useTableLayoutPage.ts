import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  buildTableGuiRequest,
  hasTableGuiChanges,
  isCustomFacilityGuiPlaced,
  isFixedFacilityGuiPlaced,
  isTableGuiPlaced,
  isTableGuiRow,
  mapToPlacedCustomFacilityItem,
  mapToPlacedFacilityItem,
  mapToPlacedTableItem,
  useSaveTableGuiMutation,
  useTableGuiQuery,
} from '../api/tableLayoutApi';
import { FACILITY_DEFAULT_SIZE, FACILITY_RESIZE_LIMITS, TABLE_LAYOUT_CANVAS_SIZE, TABLE_SIZE_PX } from '../constants';
import { snapPositionToNearbyItems } from '../utils';
import type { DraggedItemData, FacilityKind, LayoutSize, PlacedItem, PlacedNonTableItem, PlacedTableItem } from '../types';
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

  const guiRows = useMemo<TableGuiResponse[]>(() => tableGuiQuery.data ?? [], [tableGuiQuery.data]);
  const eligibleTables = useMemo(() => guiRows.filter(isTableGuiRow), [guiRows]);
  const baseTableItems = useMemo(
    () => eligibleTables.filter(isTableGuiPlaced).map(mapToPlacedTableItem),
    [eligibleTables],
  );
  const baseFacilityItemsFromServer = useMemo<PlacedNonTableItem[]>(
    () => [
      ...guiRows.filter(isFixedFacilityGuiPlaced).map(mapToPlacedFacilityItem),
      ...guiRows.filter(isCustomFacilityGuiPlaced).map(mapToPlacedCustomFacilityItem),
    ],
    [guiRows],
  );

  const [baseItems, setBaseItems] = useState<PlacedTableItem[]>([]);
  const [baseFacilityItems, setBaseFacilityItems] = useState<PlacedNonTableItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<SaveNoticeState>(null);

  useEffect(() => {
    setBaseItems(clonePlacedItems(baseTableItems) as PlacedTableItem[]);
    setBaseFacilityItems(clonePlacedItems(baseFacilityItemsFromServer) as PlacedNonTableItem[]);
    setPlacedItems([...clonePlacedItems(baseTableItems), ...clonePlacedItems(baseFacilityItemsFromServer)]);
    // 테이블·내부시설 모두 같은 저장 버튼으로 함께 저장되므로, 서버 데이터가 바뀔 때(최초 로드/저장 후
    // 재조회) draft를 통째로 다시 맞춘다.
  }, [baseTableItems, baseFacilityItemsFromServer]);

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

  const draftFacilityItems = useMemo(
    () => placedItems.filter((item): item is PlacedNonTableItem => item.kind !== 'table'),
    [placedItems],
  );

  // 테이블·내부시설을 하나의 저장 요청으로 합쳐서 dirty 여부를 함께 판단한다(별도의 "내부시설 저장"은 없다).
  const isDirty = useMemo(() => {
    const request = buildTableGuiRequest(draftTableItems, baseItems, draftFacilityItems, baseFacilityItems);
    return hasTableGuiChanges(request);
  }, [draftTableItems, baseItems, draftFacilityItems, baseFacilityItems]);

  usePreventLeave(isDirty);

  const placedTableSysIds = useMemo(
    () => new Set(draftTableItems.filter((item) => item.sysId).map((item) => item.sysId as string)),
    [draftTableItems],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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

  const handlePlaceFacility = useCallback(
    (kind: FacilityKind) => {
      const canvasNode = canvasNodeRef.current;
      // 전체 보기로 캔버스가 축소된 상태에서는 스크롤 좌표가 축소 비율만큼 어긋나므로 배치를 막는다.
      if (!canvasNode || isFitToScreen) return;

      const { width, height } = FACILITY_DEFAULT_SIZE;
      // handlePlaceTable과 동일하게, 지금 스크롤해서 보고 있는 영역의 좌상단 기준으로 배치한다.
      const scrollNode = canvasScrollNodeRef.current;
      const visibleMargin = 24;
      const visibleLeft = scrollNode?.scrollLeft ?? 0;
      const visibleTop = scrollNode?.scrollTop ?? 0;
      const x = clamp(visibleLeft + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
      const y = clamp(visibleTop + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);

      const newFacility: PlacedNonTableItem = {
        id: `facility-${kind}-${Date.now()}`,
        kind,
        x,
        y,
        width,
        height,
      };
      setPlacedItems((prev) => [...prev, newFacility]);
    },
    [isFitToScreen],
  );

  // "커스텀 시설 추가" 모달에서 이름을 입력해 만드는, 고정 8종에 없는 자유 시설(object_type '03').
  const handlePlaceCustomFacility = useCallback(
    (label: string) => {
      const canvasNode = canvasNodeRef.current;
      if (!canvasNode || isFitToScreen) return;

      const { width, height } = FACILITY_DEFAULT_SIZE;
      const scrollNode = canvasScrollNodeRef.current;
      const visibleMargin = 24;
      const visibleLeft = scrollNode?.scrollLeft ?? 0;
      const visibleTop = scrollNode?.scrollTop ?? 0;
      const x = clamp(visibleLeft + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.width - width);
      const y = clamp(visibleTop + visibleMargin, 0, TABLE_LAYOUT_CANVAS_SIZE.height - height);

      const newCustomFacility: PlacedNonTableItem = {
        id: `facility-custom-${Date.now()}`,
        kind: 'custom',
        label,
        x,
        y,
        width,
        height,
      };
      setPlacedItems((prev) => [...prev, newCustomFacility]);
    },
    [isFitToScreen],
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
    setPlacedItems([...clonePlacedItems(baseItems), ...clonePlacedItems(baseFacilityItems)]);
    setIsResetConfirmOpen(false);
  }, [baseItems, baseFacilityItems]);

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
    }
  }, [isDirty]);

  const closeSaveConfirm = useCallback(() => {
    setIsSaveConfirmOpen(false);
  }, []);

  const closeSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  // 저장은 실제 API를 부르는 동작이라(되돌리기/전체 비우기와 달리), 성공해도 화면이 바뀌지 않아 결과를
  // 안내해야 한다 — async-patterns.md §1의 noticeState 패턴을 그대로 따른다.
  // 테이블·내부시설을 같은 요청 한 번으로 함께 저장한다(object_type 01/03로 구분). 저장 후 재조회하면
  // 새로 배치한 내부시설도 서버가 발급한 sysId를 포함해 baseFacilityItems에 반영된다.
  const confirmSave = useCallback(async () => {
    const request = buildTableGuiRequest(draftTableItems, baseItems, draftFacilityItems, baseFacilityItems);
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
  }, [draftTableItems, baseItems, draftFacilityItems, baseFacilityItems, saveTableGuiMutation, queryClient]);

  return {
    placedItems,
    eligibleTables,
    placedTableSysIds,
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
    handleDragEnd,
    handlePlaceTable,
    handlePlaceFacility,
    handlePlaceCustomFacility,
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
