import './TableLayoutCanvas.css';
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard } from '@/shared/components/table';
import { CustomFacilityPlacedCard } from './CustomFacilityPlacedCard';
import { FacilityPlacedCard } from './FacilityPlacedCard';
import { TablePlacedCard } from './TablePlacedCard';
import {
  FACILITY_LABEL_BY_KIND,
  FACILITY_ICON_BY_KIND,
  FACILITY_RESIZE_LIMITS,
  TABLE_LAYOUT_CANVAS_DROPPABLE_ID,
  TABLE_LAYOUT_CANVAS_SIZE,
} from '../constants';
import type { DraggedItemData, LayoutSize, PlacedItem } from '../types';

type ResizeHandleProps = {
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
};

function ResizeHandle({ width, height, onResize }: ResizeHandleProps) {
  const startRef = useRef({ pointerX: 0, pointerY: 0, width, height });

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { pointerX: event.clientX, pointerY: event.clientY, width, height };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const start = startRef.current;
    const nextWidth = clampSize(start.width + (event.clientX - start.pointerX), 'width');
    const nextHeight = clampSize(start.height + (event.clientY - start.pointerY), 'height');
    onResize(nextWidth, nextHeight);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="table-layout-canvas__resize-handle"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}

function clampSize(value: number, axis: 'width' | 'height') {
  const min = axis === 'width' ? FACILITY_RESIZE_LIMITS.minWidth : FACILITY_RESIZE_LIMITS.minHeight;
  const max = axis === 'width' ? FACILITY_RESIZE_LIMITS.maxWidth : FACILITY_RESIZE_LIMITS.maxHeight;
  return Math.min(Math.max(value, min), max);
}

type PlacedItemViewProps = {
  item: PlacedItem;
  layoutSize: LayoutSize;
  disabled: boolean;
  onRemove: (id: string) => void;
  onResizeFacility: (id: string, width: number, height: number) => void;
};

function PlacedItemView({ item, layoutSize, disabled, onRemove, onResizeFacility }: PlacedItemViewProps) {
  const data: DraggedItemData = { origin: 'placed', id: item.id };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data,
    disabled,
  });
  const isFacility = item.kind !== 'table';

  const style = {
    left: item.x,
    top: item.y,
    width: isFacility ? item.width : undefined,
    height: isFacility ? item.height : undefined,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={`table-layout-canvas__item${isFacility ? ' table-layout-canvas__item--resizable' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      {item.kind === 'table' ? (
        <TablePlacedCard
          index={Number(item.tableNum) || 1}
          name={item.tableName || '테이블 명칭'}
          seatCount={item.seatCount}
          size={layoutSize}
          onRemove={disabled ? undefined : () => onRemove(item.id)}
        />
      ) : item.kind === 'custom' ? (
        <>
          <CustomFacilityPlacedCard
            label={item.label}
            size={layoutSize}
            viewOnly={disabled}
            onRemove={disabled ? undefined : () => onRemove(item.id)}
          />
          {!disabled && (
            <ResizeHandle
              width={item.width}
              height={item.height}
              onResize={(width, height) => onResizeFacility(item.id, width, height)}
            />
          )}
        </>
      ) : (
        <>
          <FacilityPlacedCard
            label={FACILITY_LABEL_BY_KIND[item.kind]}
            icon={FACILITY_ICON_BY_KIND[item.kind]}
            size={layoutSize}
            onRemove={disabled ? undefined : () => onRemove(item.id)}
          />
          {!disabled && (
            <ResizeHandle
              width={item.width}
              height={item.height}
              onResize={(width, height) => onResizeFacility(item.id, width, height)}
            />
          )}
        </>
      )}
    </div>
  );
}

type TableLayoutCanvasProps = {
  layoutSize: LayoutSize;
  placedItems: PlacedItem[];
  isFitToScreen: boolean;
  canvasScale: number;
  onRemoveItem: (id: string) => void;
  onResizeFacility: (id: string, width: number, height: number) => void;
  onAddCustomFacility: () => void;
  setCanvasNode: (node: HTMLElement | null) => void;
  setCanvasScrollNode: (node: HTMLElement | null) => void;
};

export function TableLayoutCanvas({
  layoutSize,
  placedItems,
  isFitToScreen,
  canvasScale,
  onRemoveItem,
  onResizeFacility,
  onAddCustomFacility,
  setCanvasNode,
  setCanvasScrollNode,
}: TableLayoutCanvasProps) {
  const { setNodeRef } = useDroppable({ id: TABLE_LAYOUT_CANVAS_DROPPABLE_ID, disabled: isFitToScreen });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setCanvasNode(node);
  };

  return (
    <TableCard
      title="테이블 배치"
      ariaLabel="테이블 배치"
      className="table-layout-canvas-card"
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Icon id="i-plus" size={13} />}
          onClick={onAddCustomFacility}
          disabled={isFitToScreen}
        >
          커스텀 시설 추가
        </Button>
      }
    >
      <div className="table-layout-canvas-scroll" ref={setCanvasScrollNode}>
        {/* 전체 보기로 축소된 상태에서는 이 래퍼가 줄어든 시각적 크기만큼만 레이아웃 공간을 차지해
            불필요한 스크롤이 생기지 않는다. 평소(scale=1)에는 캔버스 원래 크기와 같다. */}
        <div
          className="table-layout-canvas-scale"
          style={{ width: TABLE_LAYOUT_CANVAS_SIZE.width * canvasScale, height: TABLE_LAYOUT_CANVAS_SIZE.height * canvasScale }}
        >
          <div
            ref={setRefs}
            className={`table-layout-canvas table-layout-canvas--${layoutSize}`}
            style={{
              width: TABLE_LAYOUT_CANVAS_SIZE.width,
              height: TABLE_LAYOUT_CANVAS_SIZE.height,
              transform: canvasScale !== 1 ? `scale(${canvasScale})` : undefined,
              transformOrigin: 'top left',
            }}
          >
            {placedItems.map((item) => (
              <PlacedItemView
                key={item.id}
                item={item}
                layoutSize={layoutSize}
                disabled={isFitToScreen}
                onRemove={onRemoveItem}
                onResizeFacility={onResizeFacility}
              />
            ))}
          </div>
        </div>
      </div>
    </TableCard>
  );
}
