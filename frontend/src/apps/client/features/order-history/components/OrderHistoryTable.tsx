import { TableCard, TableCardContentState } from '@/shared/components/table';
import { formatOrderHistoryDatetime } from '../api/orderHistoryApi';
import type { OrderHistoryRow } from '../types';

const ORDER_STATUS_LABEL: Record<OrderHistoryRow['orderStatus'], string> = {
  RECEIVED: '접수중',
  COOKING: '조리중',
  SERVED: '서빙완료',
  CANCELLED: '취소',
};

const PAYMENT_STATUS_LABEL: Record<OrderHistoryRow['paymentStatus'], string> = {
  PENDING: '대기중',
  PAID: '결제완료',
  UNPAID: '미결제',
  REFUNDED: '환불',
};

type OrderHistoryTableProps = {
  rows: OrderHistoryRow[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
};

export function OrderHistoryTable({ rows, isLoading, isError, emptyMessage }: OrderHistoryTableProps) {
  return (
    <TableCard title="주문 이력 목록" ariaLabel="주문 이력 목록" className="order-history-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="주문 이력 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="주문 이력 목록 테이블">
            {/* 컬럼 비율을 동일하게 맞추기 위해 너비 클래스를 지정하지 않는다(table-layout: fixed가 균등 분배) */}
            <colgroup>
              <col /><col /><col /><col /><col />
            </colgroup>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>테이블 번호</th>
                <th>주문 상태</th>
                <th>결제 상태</th>
                <th>주문일자</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="common-table__empty">{emptyMessage}</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="common-table__mono">{row.orderNo}</td>
                    <td className="common-table__cell--center">{row.tableNum}</td>
                    <td className="common-table__cell--center">
                      <span
                        className={`order-history-status-badge order-history-status-badge--${row.orderStatus.toLowerCase()}`}
                      >
                        {ORDER_STATUS_LABEL[row.orderStatus]}
                      </span>
                    </td>
                    <td className="common-table__cell--center">
                      {PAYMENT_STATUS_LABEL[row.paymentStatus]}
                    </td>
                    <td className="common-table__cell--center">
                      {formatOrderHistoryDatetime(row.orderDatetime)}
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
