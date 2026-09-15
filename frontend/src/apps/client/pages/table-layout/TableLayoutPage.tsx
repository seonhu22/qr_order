import './TableLayoutPage.css';
import { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import { SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';
import { LayoutSizeToggle } from '@/apps/client/features/table-layout/components/LayoutSizeToggle';
import { FacilityListCard } from '@/apps/client/features/table-layout/components/FacilityListCard';
import { TableListCard } from '@/apps/client/features/table-layout/components/TableListCard';
import { TableLayoutCanvas } from '@/apps/client/features/table-layout/components/TableLayoutCanvas';
import { CustomFacilityAddModal } from '@/apps/client/features/table-layout/components/CustomFacilityAddModal';
import { useTableLayoutPage } from '@/apps/client/features/table-layout/hooks/useTableLayoutPage';
import { useCustomFacilityModal } from '@/apps/client/features/table-layout/hooks/useCustomFacilityModal';
import type { LayoutSize } from '@/apps/client/features/table-layout/types';

export function TableLayoutPage() {
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');
  const {
    placedItems,
    eligibleTables,
    placedTableSysIds,
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
  } = useTableLayoutPage(layoutSize);

  const customFacilityModal = useCustomFacilityModal({ onConfirm: handlePlaceCustomFacility });

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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="table-layout-page__body">
          <div className="table-layout-page__sidebar">
            <FacilityListCard disabled={isFitToScreen} onPlaceFacility={handlePlaceFacility} />
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
            onAddCustomFacility={customFacilityModal.open}
            setCanvasNode={setCanvasNode}
            setCanvasScrollNode={setCanvasScrollNode}
          />
        </div>
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

      {/* ── 커스텀 시설 추가 ── */}
      <CustomFacilityAddModal
        open={customFacilityModal.isOpen}
        label={customFacilityModal.label}
        errorText={customFacilityModal.errorText}
        onChangeLabel={customFacilityModal.changeLabel}
        onConfirm={customFacilityModal.confirm}
        onClose={customFacilityModal.close}
      />
    </section>
  );
}
