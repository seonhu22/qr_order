import './PaymentListPage.css';
import { useState } from 'react';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { PAYMENT_HISTORY_ROWS } from '@/apps/client/features/payment-status/mock/paymentStatusMock';

const COLUMNS: SharedTableColumn[] = [
  { key: 'paymentNo', label: '결제 번호', tdClassName: 'common-table__cell--left' },
  { key: 'orderNo', label: '주문 번호', tdClassName: 'common-table__cell--left' },
  { key: 'tableNumber', label: '테이블', className: 'common-table__col--sm' },
  { key: 'amount', label: '결제 금액', className: 'common-table__col--md' },
  { key: 'method', label: '결제 수단', className: 'common-table__col--md' },
  { key: 'status', label: '상태', className: 'common-table__col--md' },
  { key: 'paidAt', label: '결제 일시', className: 'common-table__col--lg' },
];

export function PaymentListPage() {
  const [selectedPaymentId, setSelectedPaymentId] = useState(PAYMENT_HISTORY_ROWS[0]?.id ?? '');
  const selectedPayment = PAYMENT_HISTORY_ROWS.find((row) => row.id === selectedPaymentId) ?? PAYMENT_HISTORY_ROWS[0];

  const rows: SharedTableRow[] = PAYMENT_HISTORY_ROWS.map((row) => ({
    id: row.id,
    selected: row.id === selectedPayment?.id,
    onSelect: () => setSelectedPaymentId(row.id),
    cells: {
      paymentNo: { type: 'text', value: row.paymentNo, className: 'common-table__mono', title: row.paymentNo },
      orderNo: { type: 'text', value: row.orderNo, className: 'common-table__mono', title: row.orderNo },
      tableNumber: { type: 'text', value: `${row.tableNumber}번` },
      amount: { type: 'text', value: row.amount.toLocaleString() },
      method: { type: 'text', value: row.method },
      status: { type: 'text', value: row.status },
      paidAt: { type: 'text', value: row.paidAt },
    },
  }));

  return (
    <section className="payment-list-page" aria-label="결제 목록 조회">
      <div className="payment-list-page__grid">
        <TableCard title="결제 목록" ariaLabel="결제 목록">
          <TableBodyRenderer
            tableAriaLabel="결제 목록 테이블"
            tableClassName="common-table payment-list-page__table"
            columns={COLUMNS}
            rows={rows}
            emptyMessage="조회된 결제가 없습니다."
          />
        </TableCard>

        <article className="payment-list-page__detail" aria-label="결제 상세">
          <h2 className="payment-list-page__detail-title">결제 상세</h2>
          <dl className="payment-list-page__detail-list">
            <div><dt>결제 번호</dt><dd>{selectedPayment?.paymentNo}</dd></div>
            <div><dt>주문 번호</dt><dd>{selectedPayment?.orderNo}</dd></div>
            <div><dt>결제 상태</dt><dd>{selectedPayment?.status}</dd></div>
            <div><dt>결제 금액</dt><dd>{selectedPayment?.amount.toLocaleString()}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
