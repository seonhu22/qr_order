import type { ParsedPaymentOrderItems, PaymentOrderItem, PaymentOrderOption } from '../types';
import { parsePaymentOrderItems } from '../utils/parsePaymentOrderItems';

const PAYMENT_YN_LABEL: Record<string, string> = {
  Y: '결제',
  N: '미결제',
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
  const paymentLabel = PAYMENT_YN_LABEL[item.paymentYn] ?? item.paymentYn;

  return (
    <li className="payment-order-items__card" key={`${menuName}-${index}`}>
      <div className="payment-order-items__card-header">
        <div className="payment-order-items__menu">
          <span className="payment-order-items__menu-name">{menuName}</span>
          {paymentLabel ? <span className="payment-order-items__payment-badge">{paymentLabel}</span> : null}
        </div>
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

function renderParsedItems(parsedItems: ParsedPaymentOrderItems) {
  if (parsedItems.kind === 'structured') {
    return (
      <ul className="payment-order-items__list">
        {parsedItems.items.map(renderStructuredItem)}
      </ul>
    );
  }

  if (parsedItems.lines.length === 0) {
    return <p className="payment-order-items__empty">주문 내역이 없습니다.</p>;
  }

  return (
    <ul className="payment-order-items__fallback-list">
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
