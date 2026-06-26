import './OrderStatusCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { calculateOrderTotal, formatOrderBoardPrice, formatOrderBoardTime } from '../utils';
import type { OrderBoardCardActions, OrderBoardRow } from '../types';

type OrderStatusCardProps = {
  row: OrderBoardRow;
  actions: OrderBoardCardActions;
  isMoved: boolean;
};

export function OrderStatusCard({ row, actions, isMoved }: OrderStatusCardProps) {
  const cardClassName = [
    'order-status-card',
    `order-status-card--${row.orderStatus.toLowerCase()}`,
    isMoved ? 'order-status-card--moved' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className="order-status-card__top-row">
        <span className="order-status-card__order-no">
          #{row.orderNo} <span className="order-status-card__field-label">(주문번호)</span>
        </span>
        <span className="order-status-card__time">
          <Icon id="i-clock" size={13} />
          {formatOrderBoardTime(row.orderDatetime)}
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
            <Button variant="primary" size="sm" onClick={() => actions.onStartCooking(row.id)}>
              조리시작
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
        {row.orderStatus === 'COOKING' && (
          <>
            <Button variant="primary" size="sm" onClick={() => actions.onServe(row.id)}>
              서빙완료
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onMoveBack(row.id)}>
              이전
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
        {row.orderStatus === 'SERVED' && (
          <>
            <Button variant="primary" size="sm" onClick={() => actions.onPay(row)}>
              결제처리
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onMoveBack(row.id)}>
              이전
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onEdit(row)}>
              수정
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.onCancel(row)}>
              취소
            </Button>
          </>
        )}
        {row.orderStatus === 'CANCELLED' && (
          <Button variant="outline" size="sm" onClick={() => actions.onShowCancelReason(row)}>
            취소사유
          </Button>
        )}
      </div>
    </article>
  );
}
