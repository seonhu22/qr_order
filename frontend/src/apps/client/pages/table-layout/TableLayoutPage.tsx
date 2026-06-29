import './TableLayoutPage.css';
import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent } from '@dnd-kit/core';
import { Button } from '@/shared/components/button';
import { SaveConfirmModal } from '@/shared/components/modal';
import { LayoutSizeToggle } from '@/apps/client/features/table-layout/components/LayoutSizeToggle';
import { FacilityListCard } from '@/apps/client/features/table-layout/components/FacilityListCard';
import { TableListCard } from '@/apps/client/features/table-layout/components/TableListCard';
import { TableLayoutCanvas } from '@/apps/client/features/table-layout/components/TableLayoutCanvas';
import { FacilityPlacedCard } from '@/apps/client/features/table-layout/components/FacilityPlacedCard';
import { useTableLayoutPage } from '@/apps/client/features/table-layout/hooks/useTableLayoutPage';
import { FACILITY_ICON_BY_KIND, FACILITY_LABEL_BY_KIND } from '@/apps/client/features/table-layout/constants';
import type { DraggedItemData, LayoutSize } from '@/apps/client/features/table-layout/types';

export function TableLayoutPage() {
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');
  const {
    placedItems,
    eligibleTables,
    placedTableSysIds,
    activeDragData,
    isSaveConfirmOpen,
    isLoading,
    isError,
    isSaving,
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
            <Button variant="secondary" onClick={handleReset}>
              리셋
            </Button>
            <Button variant="outline" onClick={handleClearAll}>
              초기화
            </Button>
            <Button variant="primary" onClick={requestSave} disabled={isSaving}>
              저장
            </Button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(event: DragStartEvent) => handleDragStart(event.active.data.current as DraggedItemData)}
        onDragEnd={handleDragEnd}
      >
        <div className="table-layout-page__body">
          <div className="table-layout-page__sidebar">
            <FacilityListCard />
            <TableListCard
              tables={eligibleTables}
              placedTableSysIds={placedTableSysIds}
              isLoading={isLoading}
              isError={isError}
              onPlaceTable={handlePlaceTable}
            />
          </div>
          <TableLayoutCanvas
            layoutSize={layoutSize}
            placedItems={placedItems}
            onRemoveItem={handleRemoveItem}
            onResizeFacility={handleResizeFacility}
            setCanvasNode={setCanvasNode}
          />
        </div>

        <DragOverlay>
          {activeDragData?.origin === 'facility-catalog' ? (
            <FacilityPlacedCard
              label={FACILITY_LABEL_BY_KIND[activeDragData.kind]}
              icon={FACILITY_ICON_BY_KIND[activeDragData.kind]}
              size={layoutSize}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <SaveConfirmModal
        open={isSaveConfirmOpen}
        title="저장하시겠습니까?"
        description="배치한 테이블 좌표를 저장합니다."
        primaryAction={{ label: '확인', loading: isSaving, onClick: confirmSave }}
        secondaryAction={{ disabled: isSaving, onClick: closeSaveConfirm }}
        onClose={closeSaveConfirm}
      />
    </section>
  );
}
