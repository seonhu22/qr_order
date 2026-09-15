import type { ParsedPaymentOrderItems, PaymentOrderItem, PaymentOrderOption } from '../types';
import { parsePaymentOrderItems } from '../utils/parsePaymentOrderItems';

const PAYMENT_YN_LABEL: Record<string, string> = {
  Y: '결제',
  N: '취소',
};

function formatAmount(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatQty(value: number): string {
  return `${value.toLocaleString('ko-KR')}개`;
}

function renderOption(option: PaymentOrderOption, index: number) {
  const optionName = option.optionName || '옵션';

  return (
    <li className="payment-order-items__option" key={`${optionName}-${index}`}>
      <span className="payment-order-items__option-name">{optionName}</span>
      <span className="payment-order-items__option-meta">
        {formatQty(option.qty)} · {formatAmount(option.price)}
      </span>
      <span className="payment-order-items__option-total">{formatAmount(option.totalPrice)}</span>
    </li>
  );
}

function renderStructuredItem(item: PaymentOrderItem, index: number) {
  const menuName = item.menuName || '메뉴명 없음';

  return (
    <li className="payment-order-items__row" key={`${menuName}-${index}`}>
      <div className="payment-order-items__row-header">
        <span className="payment-order-items__menu-name">
          {index + 1}. {menuName}
        </span>
        <strong className="payment-order-items__total">{formatAmount(item.totalPrice)}</strong>
      </div>

      <div className="payment-order-items__meta">
        <span>{formatQty(item.qty)}</span>
        <span>{formatAmount(item.price)}</span>
      </div>

      {item.options.length > 0 ? (
        <ul className="payment-order-items__options" aria-label={`${menuName} 옵션`}>
          {item.options.map(renderOption)}
        </ul>
      ) : null}
    </li>
  );
}

/** 결제(결제번호) 하나가 여러 주문을 묶어 처리할 수 있고, 주문 하나에도 메뉴가 여러 개 있을 수 있어
 * 항목을 orderNo 기준으로 그룹핑해서 보여준다. orderNo가 없는 항목은 그룹 헤더 없이 그대로 표시한다.
 * 같은 주문번호 안에서는 결제/취소가 섞이지 않으므로(항상 주문번호 단위로만 결제/취소가 갈린다),
 * 결제/취소 배지와 취소 사유는 메뉴마다가 아니라 그룹(주문번호) 하나에 한 번만 표시한다. */
type PaymentOrderGroup = { orderNo: string | null; items: PaymentOrderItem[] };

function groupItemsByOrderNo(items: PaymentOrderItem[]): PaymentOrderGroup[] {
  const groups: PaymentOrderGroup[] = [];

  items.forEach((item) => {
    const orderNo = item.orderNo ?? null;
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.orderNo === orderNo) {
      lastGroup.items.push(item);
    } else {
      groups.push({ orderNo, items: [item] });
    }
  });

  return groups;
}

/** 주문 하나(그룹)의 총 금액(옵션 포함)과 최종 결제 금액을 계산한다.
 * 취소된 주문은 총 금액과 무관하게 최종 결제 금액이 0원이다. */
function computeGroupAmounts(group: PaymentOrderGroup) {
  const groupTotal = group.items.reduce((sum, item) => {
    const optionsTotal = item.options.reduce((optionSum, option) => optionSum + option.totalPrice, 0);
    return sum + item.totalPrice + optionsTotal;
  }, 0);
  const isCancelled = group.items[0]?.paymentYn === 'N';

  return { groupTotal, finalPaymentAmount: isCancelled ? 0 : groupTotal };
}

function renderOrderGroup(group: PaymentOrderGroup, index: number) {
  const firstItem = group.items[0];
  const paymentLabel = firstItem ? PAYMENT_YN_LABEL[firstItem.paymentYn] ?? firstItem.paymentYn : '';
  const { groupTotal } = computeGroupAmounts(group);

  return (
    <li className="payment-order-items__group" key={`${group.orderNo ?? 'no-order-no'}-${index}`}>
      {group.orderNo ? (
        <div className="payment-order-items__group-header">
          <span>주문번호 {group.orderNo}</span>
          {paymentLabel ? (
            <span
              className={`payment-order-items__payment-badge payment-order-items__payment-badge--${firstItem?.paymentYn === 'N' ? 'cancelled' : 'paid'}`}
            >
              {paymentLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {firstItem?.paymentYn === 'N' && firstItem.cancelReason ? (
        <p className="payment-order-items__cancel-reason">취소 사유: {firstItem.cancelReason}</p>
      ) : null}

      <ul className="payment-order-items__list">
        {group.items.map(renderStructuredItem)}
      </ul>

      <div className="payment-order-items__group-summary">
        <span>주문 총 금액(옵션 포함) {formatAmount(groupTotal)}</span>
      </div>
    </li>
  );
}

function renderParsedItems(parsedItems: ParsedPaymentOrderItems) {
  if (parsedItems.kind === 'structured') {
    const groups = groupItemsByOrderNo(parsedItems.items);
    const grandTotal = groups.reduce((sum, group) => sum + computeGroupAmounts(group).finalPaymentAmount, 0);

    return (
      <div className="payment-order-items__content">
        <ul className="payment-order-items__group-list">
          {groups.map(renderOrderGroup)}
        </ul>

        <div className="payment-order-items__grand-total">
          <span>전체 결제 금액</span>
          <strong>{formatAmount(grandTotal)}</strong>
        </div>
      </div>
    );
  }

  if (parsedItems.lines.length === 0) {
    return <p className="payment-order-items__content payment-order-items__empty">주문 내역이 없습니다.</p>;
  }

  return (
    <ul className="payment-order-items__content payment-order-items__fallback-list">
      {parsedItems.lines.map((line, index) => (
        <li key={`${line}-${index}`}>{line}</li>
      ))}
    </ul>
  );
}

type PaymentOrderItemsListProps = {
  items: string;
};

export function PaymentOrderItemsList({ items }: PaymentOrderItemsListProps) {
  const parsedItems = parsePaymentOrderItems(items);

  return (
    <div className="payment-status-detail-form__field payment-order-items">
      <span className="payment-order-items__label">주문 내역</span>
      {renderParsedItems(parsedItems)}
    </div>
  );
}
