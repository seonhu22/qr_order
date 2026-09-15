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
 *
 * 헤더·칩·"호출하기" 버튼은 고정하고 선택 목록만 내부 스크롤된다(참고 저장소의 `subtle-box`,
 * "스크롤 안의 스크롤" — ADR-034). 항목을 많이 고를수록 버튼이 아래로 밀려나 손이 닿기
 * 어려워지는 걸 막기 위함이다. 참고 저장소는 칩이 먼저·목록이 아래지만, 자주 조작하는 수량
 * 조절 목록을 헤더 바로 아래로 올리기 위해 순서를 반대로 뒀다(목록 → 칩).
 */
export function StaffCallSheetContent({ onClose }: StaffCallSheetContentProps) {
  const {
    items,
    activeIds,
    itemQty,
    activeItems,
    hasAny,
    toggleItem,
    changeQty,
    confirmCall,
    isSubmitting,
    submitError,
    isLoading,
    loadError,
  } = useStaffCall();

  async function handleConfirm() {
    if (await confirmCall()) onClose();
  }

  return (
    <div className="staff-call-sheet">
      <div className="staff-call-sheet__header">
        <ConsumerIcon id="ci-bell" size={16} />
        <span className="staff-call-sheet__header-title">직원호출</span>
      </div>

      <div className="staff-call-sheet__scroll-area">
        {isLoading && <p role="status">호출 항목을 불러오는 중입니다.</p>}
        {loadError && <p role="alert">호출 항목을 불러오지 못했습니다.</p>}
        {activeItems.length > 0 && (
          <ul className="staff-call-sheet__selected-list">
            {activeItems.map((item) => {
              const qty = itemQty[item.id] ?? 1;
              return (
                <li key={item.id} className="staff-call-sheet__selected-row">
                  <span className="staff-call-sheet__selected-label">{item.label}</span>
                  {item.showQty && (
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
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="staff-call-sheet__chips">
          {items.map((item) => {
            const isOn = activeIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`staff-call-sheet__chip${isOn ? ' staff-call-sheet__chip--on' : ''}`}
                onClick={() => toggleItem(item.id, item.showQty)}
                aria-pressed={isOn}
              >
                <ConsumerIcon
                  id={item.showQty ? 'ci-plus' : 'ci-check'}
                  size={12}
                  className="staff-call-sheet__chip-icon"
                />
                {item.label}
                {item.showQty && isOn && (
                  <span className="staff-call-sheet__chip-qty">{itemQty[item.id] ?? 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="order-shell-sheet__action"
        disabled={!hasAny || isSubmitting}
        onClick={handleConfirm}
      >
        {isSubmitting ? '호출 중...' : '호출하기'}
      </Button>
      {submitError && <p role="alert">{submitError}</p>}
    </div>
  );
}
