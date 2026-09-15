import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import '@/shared/order-status/orderStatusBadge.css';
import {
  ORDER_STATUS_BADGE_CLASS,
  ORDER_STATUS_LABEL,
} from '@/shared/order-status/statusMeta';
import { useConsumerOrderDetailsQueries, useConsumerOrdersQuery } from '../api/consumerOrderApi';
import { normalizeConsumerOrderStatus } from '../orderStatusMeta';
import type { OrderShellCartOption } from '../types';
import './OrderHistorySheet.css';

type OrderHistorySheetProps = {
  onClose: () => void;
};

/** "치즈 토핑 (+1,500원) ×2" — 추가금·개수가 있을 때만 붙인다. CartLineItem과 동일한 포맷. */
function formatOptionLine(option: OrderShellCartOption) {
  const parts = [option.choiceName];
  if (option.price > 0) parts.push(`(+${option.price.toLocaleString()}원)`);
  if ((option.qty ?? 1) > 1) parts.push(`×${option.qty}`);
  return parts.join(' ');
}

function formatOrderTime(date: Date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 주문내역 시트 — "주문하기"로 완료된 주문만 담는다(장바구니에 담기만 하고 아직 주문 안 한 건
 * 포함하지 않는다). 참고 저장소는 모든 주문의 아이템을 시간 구분 없이 한 목록으로 합쳐 보여주지만,
 * 같은 메뉴를 다른 시각에 여러 번 주문했을 때 구분이 안 돼 헷갈릴 수 있어 주문 건별로 시각과 함께
 * 묶어서 보여주도록 바꿨다.
 */
export function OrderHistorySheet({ onClose }: OrderHistorySheetProps) {
  const { session } = useConsumerSession();
  const sessionId = session?.consumerSessionId ?? '';
  const orderList = useConsumerOrdersQuery(sessionId);
  const orderDetails = useConsumerOrderDetailsQueries(sessionId, orderList.data ?? []);
  const orders = orderDetails.flatMap((query) => (query.data ? [query.data] : []));
  const isLoading = orderList.isLoading || orderDetails.some((query) => query.isLoading);
  const isError = orderList.isError || orderDetails.some((query) => query.isError);
  const totalOrderedQty = orders.reduce(
    (sum, order) => sum + order.items.reduce((lineSum, line) => lineSum + line.qty, 0),
    0,
  );
  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="order-shell-sheet">
      <div className="order-shell-cart-header">
        <ConsumerIcon id="ci-receipt" size={16} />
        <span className="order-shell-cart-header__title">주문내역</span>
        {totalOrderedQty > 0 && (
          <span className="order-shell-cart-header__count">{totalOrderedQty}</span>
        )}
      </div>

      {isLoading ? (
        <p className="order-shell-sheet__placeholder">주문내역을 불러오는 중입니다.</p>
      ) : isError ? (
        <div className="order-shell-cart-empty">
          <p className="order-shell-cart-empty__text">주문내역을 불러오지 못했습니다.</p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              void orderList.refetch();
              orderDetails.forEach((query) => void query.refetch());
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="order-shell-cart-empty">
          <ConsumerIcon id="ci-receipt" size={36} className="order-shell-cart-empty__icon" />
          <p className="order-shell-cart-empty__text">주문내역이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul className="order-history-list">
            {orders.map((order) => {
              const statusKey = normalizeConsumerOrderStatus(order.orderStatus);
              return (
                <li key={order.orderId} className="order-history-group">
                  <div className="order-history-group__header">
                    <span className="order-history-group__time">
                      {formatOrderTime(order.orderedAt)} 접수
                      <span className="order-history-group__order-no">#{order.orderNo}</span>
                      {statusKey && (
                        <span
                          className={`order-status-badge ${ORDER_STATUS_BADGE_CLASS[statusKey]}`}
                        >
                          {ORDER_STATUS_LABEL[statusKey]}
                        </span>
                      )}
                    </span>
                    <span className="order-history-group__total">
                      {order.total.toLocaleString()}원
                    </span>
                  </div>
                  <ul className="order-history-group__items">
                    {order.items.map((line) => (
                      <li key={line.cartKey} className="order-history-item">
                        <div className="order-history-item__top">
                          <p className="order-history-item__name">{line.name}</p>
                          <span className="order-history-item__qty">{line.qty}개</span>
                        </div>
                        {line.options.length > 0 && (
                          <div className="order-history-item__options">
                            {line.options.map((option) => (
                              <p key={option.choiceId}>{formatOptionLine(option)}</p>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          <div className="order-shell-cart-total">
            <span className="order-shell-cart-total__label">총 결제 금액</span>
            <span className="order-shell-sheet__price">{grandTotal.toLocaleString()}원</span>
          </div>
        </>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="order-shell-sheet__action"
        onClick={onClose}
      >
        확인
      </Button>
    </div>
  );
}
