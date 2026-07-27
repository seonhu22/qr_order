import { TableCard, TableCardContentState } from '@/shared/components/table';
import { useClickableRow } from '@/shared/hooks/useClickableRow';
import type { PaymentStatusMasterRow } from '../types';

const PAYMENT_STATUS_LABEL: Record<PaymentStatusMasterRow['paymentStatus'], string> = {
  PAID: '결제완료',
  UNPAID: '미결제',
};

/** 결제 수단은 결제완료(PAID) 건에만 의미가 있다 — 미결제·식사중 건은 항상 "-"로 표시한다. */
function formatPaymentType(row: PaymentStatusMasterRow): string {
  if (row.paymentStatus !== 'PAID') return '-';
  return row.paymentType || '-';
}

type PaymentStatusMasterTableProps = {
  rows: PaymentStatusMasterRow[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  selectedId: string;
  onSelectRow: (row: PaymentStatusMasterRow) => void;
};

export function PaymentStatusMasterTable({
  rows,
  isLoading,
  isError,
  emptyMessage,
  selectedId,
  onSelectRow,
}: PaymentStatusMasterTableProps) {
  const { getRowProps } = useClickableRow<PaymentStatusMasterRow>(onSelectRow);

  return (
    <TableCard title="결제 목록" ariaLabel="결제 목록" className="payment-status-master-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="결제 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="결제 목록 테이블">
            <colgroup>
              <col /><col /><col /><col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">결제번호</th>
                <th scope="col">결제 수단</th>
                <th scope="col">결제 금액</th>
                <th scope="col">결제 상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="common-table__empty">{emptyMessage}</td></tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.id === selectedId ? 'is-selected' : undefined}
                    {...getRowProps(row, `${row.orderNo} 결제 상세 보기`)}
                  >
                    <td className="common-table__mono">{row.orderNo}</td>
                    <td className="common-table__cell--center">{formatPaymentType(row)}</td>
                    <td className="common-table__cell--center">
                      {row.totalPrice.toLocaleString('ko-KR')}원
                    </td>
                    <td className="common-table__cell--center">
                      <span
                        className={`payment-status-badge payment-status-badge--${row.paymentStatus.toLowerCase()}`}
                      >
                        {PAYMENT_STATUS_LABEL[row.paymentStatus]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
