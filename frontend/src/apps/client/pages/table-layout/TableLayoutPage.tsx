import './TableLayoutPage.css';
import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent } from '@dnd-kit/core';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';
import { LayoutSizeToggle } from '@/apps/client/features/table-layout/components/LayoutSizeToggle';
import { FacilityListCard } from '@/apps/client/features/table-layout/components/FacilityListCard';
import { TableListCard } from '@/apps/client/features/table-layout/components/TableListCard';
import { TableLayoutCanvas } from '@/apps/client/features/table-layout/components/TableLayoutCanvas';
import { FacilityPlacedCard } from '@/apps/client/features/table-layout/components/FacilityPlacedCard';
import { useTableLayoutPage } from '@/apps/client/features/table-layout/hooks/useTableLayoutPage';
import { FACILITY_ICON_BY_KIND, FACILITY_LABEL_BY_KIND } from '@/apps/client/features/table-layout/constants';
import type { DraggedItemData, LayoutSize } from '@/apps/client/features/table-layout/types';

/**
 * 드래그 시작 시점의 포인터(클릭/터치) 좌표가 원래 노드 안에서 어느 지점이었는지(px)를 반환한다.
 * `event.active.rect.current.initial`은 dnd-kit이 `useLayoutEffect`로 나중에 채우는 값이라
 * `onDragStart` 콜백 시점에는 아직 `null`이다 — 대신 클릭한 DOM 요소에서 바로 `getBoundingClientRect()`로
 * 동기적으로 계산한다.
 */
function getPointerOffsetInRect(event: DragStartEvent): { x: number; y: number } | null {
  const activatorEvent = event.activatorEvent;
  if (!('clientX' in activatorEvent) || !('clientY' in activatorEvent)) return null;
  const { clientX, clientY, target } = activatorEvent as PointerEvent;
  const sourceElement = target instanceof Element ? target.closest('.facility-list-card__item') : null;
  if (!sourceElement) return null;
  const rect = sourceElement.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function TableLayoutPage() {
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');
  const [dragGrabOffset, setDragGrabOffset] = useState<{ x: number; y: number } | null>(null);
  const {
    placedItems,
    eligibleTables,
    placedTableSysIds,
    activeDragData,
    isSaveConfirmOpen,
    saveNotice,
    isResetConfirmOpen,
    isClearAllConfirmOpen,
    isFitToScreen,
    canvasScale,
    isLoading,
    isError,
    isSaving,
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
  } = useTableLayoutPage(layoutSize);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <section className="table-layout-page" aria-label="테이블 배치 관리">
      <div className="table-layout-page__header">
        <div className="table-layout-page__title-group">
          <p className="table-layout-page__title">테이블 배치 관리</p>
          <p className="table-layout-page__subtitle">
            테이블 사용여부를 '활성'하고 'QR코드'를 등록해야 목록에 표시됩니다.
          </p>
        </div>
        <div className="table-layout-page__actions">
          <LayoutSizeToggle value={layoutSize} onChange={setLayoutSize} />
          <div className="table-layout-page__buttons">
            <Button
              variant="icon"
              className="table-layout-page__icon-button"
              aria-label="되돌리기"
              iconOnly={<Icon id="i-return" size={16} />}
              onClick={requestReset}
            />
            <Button
              variant="icon"
              className="table-layout-page__icon-button"
              aria-label="전체 비우기"
              iconOnly={<Icon id="i-trash" size={16} />}
              onClick={requestClearAll}
            />
            <Button
              variant={isFitToScreen ? 'primary' : 'tinted'}
              leftIcon={<Icon id="i-expand" size={15} />}
              aria-pressed={isFitToScreen}
              onClick={toggleFitToScreen}
            >
              전체보기
            </Button>
            <Button variant="primary" onClick={requestSave} disabled={isSaving}>
              저장
            </Button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(event: DragStartEvent) => {
          setDragGrabOffset(getPointerOffsetInRect(event));
          handleDragStart(event.active.data.current as DraggedItemData);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="table-layout-page__body">
          <div className="table-layout-page__sidebar">
            <FacilityListCard disabled={isFitToScreen} />
            <TableListCard
              tables={eligibleTables}
              placedTableSysIds={placedTableSysIds}
              isLoading={isLoading}
              isError={isError}
              disabled={isFitToScreen}
              onPlaceTable={handlePlaceTable}
            />
          </div>
          <TableLayoutCanvas
            layoutSize={layoutSize}
            placedItems={placedItems}
            isFitToScreen={isFitToScreen}
            canvasScale={canvasScale}
            onRemoveItem={handleRemoveItem}
            onResizeFacility={handleResizeFacility}
            setCanvasNode={setCanvasNode}
            setCanvasScrollNode={setCanvasScrollNode}
          />
        </div>

        <DragOverlay className="table-layout-drag-overlay" dropAnimation={null}>
          {activeDragData?.origin === 'facility-catalog' ? (
            <span
              className="table-layout-drag-overlay__anchor"
              style={dragGrabOffset ? { left: dragGrabOffset.x, top: dragGrabOffset.y } : undefined}
            >
              <FacilityPlacedCard
                label={FACILITY_LABEL_BY_KIND[activeDragData.kind]}
                icon={FACILITY_ICON_BY_KIND[activeDragData.kind]}
                size={layoutSize}
              />
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── 되돌리기 확인 (아이콘 없는 좌측 정렬 — order-cancel-modal__notice와 동일 패턴) ── */}
      <WrapperModal
        size="sm"
        open={isResetConfirmOpen}
        title="알림"
        primaryAction={{ label: '확인', onClick: confirmReset }}
        secondaryAction={{ label: '닫기', onClick: closeResetConfirm }}
        onClose={closeResetConfirm}
      >
        <div className="table-layout-confirm-modal__notice">
          <p className="table-layout-confirm-modal__notice-title">
            초기 저장됐던 배치로 되돌리시겠습니까?
          </p>
          <p className="table-layout-confirm-modal__notice-desc">
            저장하지 않은 변경 내용은 모두 사라집니다.
          </p>
        </div>
      </WrapperModal>

      {/* ── 전체 비우기 확인 ── */}
      <WrapperModal
        size="sm"
        open={isClearAllConfirmOpen}
        title="알림"
        primaryAction={{ label: '확인', onClick: confirmClearAll }}
        secondaryAction={{ label: '닫기', onClick: closeClearAllConfirm }}
        onClose={closeClearAllConfirm}
      >
        <div className="table-layout-confirm-modal__notice">
          <p className="table-layout-confirm-modal__notice-title">
            배치된 모든 테이블·내부시설을 화면에서 비우시겠습니까?
          </p>
          <p className="table-layout-confirm-modal__notice-desc">
            저장 전까지는 실제로 반영되지 않습니다.
          </p>
        </div>
      </WrapperModal>

      {/* ── 저장 확인 ── */}
      <WrapperModal
        size="sm"
        open={isSaveConfirmOpen}
        title="알림"
        primaryAction={{ label: '확인', loading: isSaving, onClick: confirmSave }}
        secondaryAction={{ label: '닫기', disabled: isSaving, onClick: closeSaveConfirm }}
        onClose={closeSaveConfirm}
      >
        <div className="table-layout-confirm-modal__notice">
          <p className="table-layout-confirm-modal__notice-title">저장하시겠습니까?</p>
          <p className="table-layout-confirm-modal__notice-desc">배치한 테이블 좌표를 저장합니다.</p>
        </div>
      </WrapperModal>

      {/* ── 저장 결과 안내(성공/실패 공용) ── */}
      <SimpleDefaultModal
        open={saveNotice !== null}
        title={saveNotice?.title ?? '안내'}
        description={saveNotice?.description}
        onClose={closeSaveNotice}
      />
    </section>
  );
}
