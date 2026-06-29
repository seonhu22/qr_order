import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { FACILITY_RESIZE_LIMITS, TABLE_SIZE_PX } from '../constants';
import type { DraggedItemData, LayoutSize, PlacedFacilityItem, PlacedItem, PlacedTableItem } from '../types';
import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';

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

  useEffect(() => {
    const node = canvasNodeRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPlacedItems((prev) =>
        prev.map((item) => ({
          ...item,
          x: clamp(item.x, 0, width - item.width),
          y: clamp(item.y, 0, height - item.height),
        })),
      );
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

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
    const x = clamp(draggedRect.left - canvasRect.left, 0, canvasRect.width - width);
    const y = clamp(draggedRect.top - canvasRect.top, 0, canvasRect.height - height);

    if (data.origin === 'placed') {
      setPlacedItems((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, x, y, width, height } : item)),
      );
      return;
    }

    if (data.origin === 'facility-catalog') {
      const newFacility: PlacedFacilityItem = {
        id: `facility-${data.kind}-${Date.now()}`,
        kind: data.kind,
        x,
        y,
        width,
        height,
      };
      setPlacedItems((prev) => [...prev, newFacility]);
    }
  }, []);

  const handlePlaceTable = useCallback(
    (table: TableGuiResponse) => {
      const canvasNode = canvasNodeRef.current;
      if (!canvasNode || !table.sysId || placedTableSysIds.has(table.sysId)) return;

      const { width, height } = TABLE_SIZE_PX[layoutSize];
      const canvasRect = canvasNode.getBoundingClientRect();
      const x = clamp((canvasRect.width - width) / 2, 0, canvasRect.width - width);
      const y = clamp((canvasRect.height - height) / 2, 0, canvasRect.height - height);

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
    [layoutSize, placedTableSysIds],
  );

  const handleResizeFacility = useCallback((id: string, width: number, height: number) => {
    const canvasNode = canvasNodeRef.current;
    if (!canvasNode) return;

    const canvasRect = canvasNode.getBoundingClientRect();
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.kind === 'table') return item;

        const nextWidth = clamp(
          width,
          FACILITY_RESIZE_LIMITS.minWidth,
          Math.min(FACILITY_RESIZE_LIMITS.maxWidth, canvasRect.width - item.x),
        );
        const nextHeight = clamp(
          height,
          FACILITY_RESIZE_LIMITS.minHeight,
          Math.min(FACILITY_RESIZE_LIMITS.maxHeight, canvasRect.height - item.y),
        );
        return { ...item, width: nextWidth, height: nextHeight };
      }),
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setPlacedItems(clonePlacedItems(baseItems));
  }, [baseItems]);

  const handleClearAll = useCallback(() => {
    if (!window.confirm('배치된 모든 항목을 삭제할까요? 저장 전까지는 되돌릴 수 있습니다.')) return;
    setPlacedItems([]);
  }, []);

  const requestSave = useCallback(() => {
    if (!isDirty) return;
    setIsSaveConfirmOpen(true);
  }, [isDirty]);

  const closeSaveConfirm = useCallback(() => {
    setIsSaveConfirmOpen(false);
  }, []);

  const confirmSave = useCallback(async () => {
    const request = buildTableGuiRequest(draftTableItems, baseItems);
    if (hasTableGuiChanges(request)) {
      await saveTableGuiMutation.mutateAsync(request);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tableLayout.lists });
    }
    setIsSaveConfirmOpen(false);
  }, [draftTableItems, baseItems, saveTableGuiMutation, queryClient]);

  return {
    placedItems,
    eligibleTables,
    placedTableSysIds,
    activeDragData,
    isDirty,
    isSaveConfirmOpen,
    isLoading: tableGuiQuery.isLoading,
    isError: tableGuiQuery.isError,
    isSaving: saveTableGuiMutation.isPending,
    setCanvasNode,
    handleDragStart,
    handleDragEnd,
    handlePlaceTable,
    handleResizeFacility,
    handleRemoveItem,
    handleReset,
    handleClearAll,
    requestSave,
    confirmSave,
    closeSaveConfirm,
  };
}
