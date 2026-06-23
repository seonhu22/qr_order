import { TableCard, TableCardContentState } from '@/shared/components/table';
import type { SettlementRow } from '../types';

type SettlementTableProps = {
  rows: SettlementRow[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
};

export function SettlementTable({ rows, isLoading, isError, emptyMessage }: SettlementTableProps) {
  return (
    <TableCard title="매출 내역" ariaLabel="매출 내역" className="settlement-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="매출 내역을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="매출 내역 테이블">
            <colgroup>
              <col /><col /><col /><col /><col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">날짜</th>
                <th scope="col">총 결제 금액</th>
                <th scope="col">취소 금액</th>
                <th scope="col">순 매출</th>
                <th scope="col">주문 건수</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="common-table__empty">{emptyMessage}</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="common-table__cell--center">{row.date}</td>
                    <td className="common-table__cell--center">{row.totalPrice.toLocaleString('ko-KR')}원</td>
                    <td className="common-table__cell--center">
                      {row.cancelPrice > 0 ? `${row.cancelPrice.toLocaleString('ko-KR')}원` : '-'}
                    </td>
                    <td className="common-table__cell--center">{row.netPrice.toLocaleString('ko-KR')}원</td>
                    <td className="common-table__cell--center">{row.orderCount}건</td>
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
