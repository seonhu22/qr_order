import type { SubscriptionInvoiceRow } from '../types';
import { formatKst, formatWon, INVOICE_STATUS_LABEL } from '../utils/subscriptionDisplay';
import './Subscription.css';

export function SubscriptionInvoiceTable({ rows }: { rows: SubscriptionInvoiceRow[] }) {
  if (rows.length === 0) return <p className="subscription-card__description">결제 이력이 없습니다.</p>;
  return (
    <table className="subscription-invoices" aria-label="결제 이력">
      <thead>
        <tr>
          <th>기간</th>
          <th>금액</th>
          <th>상태</th>
          <th>결제 시각</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.invoiceSysId}>
            <td>{formatKst(row.periodStartAt)} ~ {formatKst(row.periodEndAt)}</td>
            <td>
              {formatWon(row.amount)}
              {row.refundedAmount > 0 ? ` (환불 ${formatWon(row.refundedAmount)})` : ''}
            </td>
            <td>{INVOICE_STATUS_LABEL[row.status] ?? row.status}</td>
            <td>{formatKst(row.paidAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
