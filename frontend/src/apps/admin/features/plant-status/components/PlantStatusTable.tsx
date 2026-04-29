import { TableCard, TableCardContentState } from '@/shared/components/table';
import type { PlantStatusRow } from '../types';

const STATUS_LABEL: Record<PlantStatusRow['status'], string> = {
  active: '활성',
  expiring: '만료 임박',
  expired: '만료',
};

type PlantStatusTableProps = {
  rows: PlantStatusRow[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
};

export function PlantStatusTable({ rows, isLoading, isError, emptyMessage = '데이터가 없습니다.' }: PlantStatusTableProps) {
  return (
    <TableCard title="사업장 상태 목록" ariaLabel="사업장 상태 목록" className="plant-status-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="사업장 상태 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="사업장 상태 목록 테이블">
            <colgroup>
              <col /><col /><col /><col /><col /><col /><col className="common-table__col--md" />
            </colgroup>
            <thead>
              <tr>
                <th>사업자 번호</th>
                <th>결제 요금 코드</th>
                <th>결제 요금명</th>
                <th>라이센스 기간(월)</th>
                <th>결제 날짜</th>
                <th>라이센스 만료 날짜</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="common-table__empty">{emptyMessage}</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="common-table__mono">{row.plantCode}</td>
                    <td className="common-table__mono">{row.paymentCode}</td>
                    <td>{row.paymentName}</td>
                    <td className="common-table__cell--center">
                      {row.licenseValidMonth != null ? `${row.licenseValidMonth}개월` : '-'}
                    </td>
                    <td className="common-table__cell--center">{row.lastCheckoutDate}</td>
                    <td className="common-table__cell--center">{row.estimateCheckoutDate}</td>
                    <td>
                      <span className={`plant-status-badge plant-status-badge--${row.status}`}>
                        {STATUS_LABEL[row.status]}
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