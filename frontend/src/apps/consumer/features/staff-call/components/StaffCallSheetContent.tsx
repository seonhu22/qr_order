import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';
import { QuantityStepperButton } from '@/apps/consumer/features/order-shell/components/QuantityStepperButton';
import { useStaffCall } from '../hooks/useStaffCall';
import './StaffCallSheetContent.css';

type StaffCallSheetContentProps = {
  onClose: () => void;
};

/**
 * 직원호출 시트 본문 — 참고 저장소의 `StaffCallSheet`와 같은 구성.
 * 사전 확인 모달 없이 "호출하기"를 누르면 바로 요청을 보내고 시트를 닫는다. 호출 후 상태는
 * 시트 밖(헤더 하이라이트 + 토스트, `consumerStaffCallStore`)이 보여준다.
 */
export function StaffCallSheetContent({ onClose }: StaffCallSheetContentProps) {
  const {
    items,
    itemQty,
    staffToggle,
    selectedItems,
    hasAny,
    addItem,
    changeQty,
    toggleStaffCall,
    confirmCall,
  } = useStaffCall();

  function handleConfirm() {
    confirmCall();
    onClose();
  }

  return (
    <div className="staff-call-sheet">
      <div className="staff-call-sheet__header">
        <ConsumerIcon id="ci-bell" size={16} />
        <span className="staff-call-sheet__header-title">직원호출</span>
        <button
          type="button"
          className={`staff-call-sheet__toggle${staffToggle ? ' staff-call-sheet__toggle--on' : ''}`}
          onClick={toggleStaffCall}
          aria-pressed={staffToggle}
        >
          <ConsumerIcon id="ci-bell" size={11} />
          직원호출
          <span className="staff-call-sheet__toggle-dot" aria-hidden="true" />
        </button>
      </div>

      <div className="staff-call-sheet__chips">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="staff-call-sheet__chip"
            onClick={() => addItem(item.id)}
          >
            <ConsumerIcon id="ci-plus" size={12} className="staff-call-sheet__chip-icon" />
            {item.label}
          </button>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <ul className="staff-call-sheet__selected-list">
          {selectedItems.map((item) => {
            const qty = itemQty[item.id] ?? 0;
            return (
              <li key={item.id} className="staff-call-sheet__selected-row">
                <span className="staff-call-sheet__selected-label">{item.label}</span>
                <div className="staff-call-sheet__stepper">
                  <QuantityStepperButton
                    icon={qty === 1 ? 'remove' : 'minus'}
                    className={`staff-call-sheet__qty-button${
                      qty === 1 ? ' staff-call-sheet__qty-button--danger' : ''
                    }`}
                    iconSize={11}
                    onClick={() => changeQty(item.id, -1)}
                    ariaLabel={qty === 1 ? `${item.label} 삭제` : `${item.label} 수량 줄이기`}
                  />
                  <output className="staff-call-sheet__qty-value" aria-label={`${item.label} 수량`}>
                    {qty}
                  </output>
                  <QuantityStepperButton
                    icon="plus"
                    className="staff-call-sheet__qty-button"
                    iconSize={11}
                    onClick={() => changeQty(item.id, 1)}
                    ariaLabel={`${item.label} 수량 늘리기`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="order-shell-sheet__action"
        disabled={!hasAny}
        onClick={handleConfirm}
      >
        호출하기
      </Button>
    </div>
  );
}
