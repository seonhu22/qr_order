import { memo } from 'react';
import './OrderStatusCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { calculateOrderTotal, formatOrderBoardPrice, formatOrderBoardTime } from '../utils';
import { useFadeOutExit } from '../hooks/useFadeOutExit';
import { useDelayedPending } from '../hooks/useDelayedPending';
import type { OrderBoardCardActions, OrderBoardRow } from '../types';

type OrderStatusCardProps = {
  row: OrderBoardRow;
  actions: OrderBoardCardActions;
  isMoved: boolean;
  isPending: boolean;
  mutationError?: string;
  isLeaving?: boolean;
  onExited?: () => void;
};

function OrderStatusCardImpl({ row, actions, isMoved, isPending, mutationError, isLeaving, onExited }: OrderStatusCardProps) {
  const fadeRef = useFadeOutExit(isLeaving, onExited);
  const showLoading = useDelayedPending(isPending);

  const cardClassName = [
    'order-status-card',
    `order-status-card--${row.orderStatus.toLowerCase()}`,
    isMoved ? 'order-status-card--moved' : '',
    isLeaving ? 'order-status-card--leaving' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      ref={fadeRef}
      className={cardClassName}
      aria-busy={isPending || undefined}
      aria-hidden={isLeaving || undefined}
    >
      <div className="order-status-card__top-row">
        <span className="order-status-card__order-no">
          #{row.orderNo} <span className="order-status-card__field-label">(주문번호)</span>
        </span>
        <span className="order-status-card__time">
          <Icon id="i-clock" size={13} />
          주문시간 {formatOrderBoardTime(row.orderDatetime)}
        </span>
      </div>

      <p className="order-status-card__table">
        {row.tableNum}번 테이블 <span className="order-status-card__field-label">(테이블 번호)</span>
      </p>

      <ul className="order-status-card__menu-list">
        {row.menuItems.map((menu) => (
          <li key={menu.id} className="order-status-card__menu-item">
            <div className="order-status-card__menu-item-row">
              <span className="order-status-card__menu-name">• {menu.name}</span>
              <span className="order-status-card__menu-qty">X {menu.quantity}</span>
            </div>
            {menu.options.length > 0 && (
              <ul className="order-status-card__option-list">
                {menu.options.map((option) => (
                  <li key={option.id} className="order-status-card__option-item">
                    <span className="order-status-card__option-name">↳ {option.name}</span>
                    <span className="order-status-card__option-qty">X {option.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="order-status-card__divider" />

      <p className="order-status-card__total">{formatOrderBoardPrice(calculateOrderTotal(row))}</p>

      <div className="order-status-card__actions">
        {row.orderStatus === 'RECEIVED' && (
          <>
            <Button variant="primary" size="sm" loading={showLoading} onClick={() => actions.onStartCooking(row.id)}>
              조리시작
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
        {row.orderStatus === 'COOKING' && (
          <>
            <Button variant="primary" size="sm" loading={showLoading} onClick={() => actions.onServe(row.id)}>
              서빙완료
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onMoveBack(row.id)}>
              이전
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
        {row.orderStatus === 'SERVED' && (
          <>
            <Button variant="primary" size="sm" disabled={isPending} onClick={() => actions.onPay(row)}>
              결제처리
            </Button>
            <Button variant="outline" size="sm" loading={showLoading} onClick={() => actions.onMoveBack(row.id)}>
              이전
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
      </div>
      {mutationError && <p className="order-status-card__error" role="alert">{mutationError}</p>}
    </article>
  );
}

/**
 * `actions`/`onExited`는 부모가 매 렌더 새로 만드는 참조라 기본 shallow 비교로 memo하면 효과가 없다.
 * 실제로 카드 출력을 바꾸는 값(row/isMoved/isPending/mutationError/isLeaving)만 비교해서,
 * 카드가 많은 컬럼에서 무관한 상태 변경(다른 카드의 pending 등)에 전부 리렌더되는 걸 막는다.
 * 이미 사라지는 중(isLeaving)이면 그 뒤로는 완전히 멈춘다 — mutate 성공 직후 pendingOrderIds가
 * 풀리면서 버튼 로딩 스피너가 사라지는 리렌더가 페이드아웃 도중에 끼어들면, 그게 또 하나의
 * 깜빡임처럼 보인다. 사라지는 카드의 내부 상태는 더 이상 의미가 없으니 그대로 고정해둔다.
 */
export const OrderStatusCard = memo(OrderStatusCardImpl, (prev, next) => {
  if (next.isLeaving) return prev.isLeaving === next.isLeaving;
  return (
    prev.row === next.row &&
    prev.isMoved === next.isMoved &&
    prev.isPending === next.isPending &&
    prev.mutationError === next.mutationError &&
    prev.isLeaving === next.isLeaving
  );
});
