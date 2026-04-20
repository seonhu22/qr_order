import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
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
};

export function PlantStatusTable({ rows, isLoading, isError }: PlantStatusTableProps) {
  const renderBody = () => {
    if (!rows.length) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={7}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id}>
        <td className="common-table__mono common-table__cell--left">{row.plantCode}</td>
        <td className="common-table__mono common-table__cell--left">{row.paymentCode}</td>
        <td className="common-table__cell--left">{row.paymentName}</td>
        <td>{row.licenseValidMonth != null ? `${row.licenseValidMonth}개월` : '-'}</td>
        <td>{row.lastCheckoutDate}</td>
        <td>{row.estimateCheckoutDate}</td>
        <td>
          <span className={`plant-status-badge plant-status-badge--${row.status}`}>
            {STATUS_LABEL[row.status]}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <TableCard title="사업장 상태 목록" ariaLabel="사업장 상태 목록" className="plant-status-table">
      {isLoading ? (
        <FeedbackState variant="loading" title="사업장 상태 목록을 불러오는 중입니다." />
      ) : isError ? (
        <FeedbackState variant="error" description="다시 한번 시도해주세요." />
      ) : (
        <div className="common-table-wrap">
          <table className="common-table" aria-label="사업장 상태 목록 테이블">
            <thead>
              <tr>
                <th className="common-table__cell--left">사업자 번호</th>
                <th className="common-table__cell--left">결제 요금 코드</th>
                <th className="common-table__cell--left">결제 요금명</th>
                <th>라이센스 기간(월)</th>
                <th>결제 날짜</th>
                <th>라이센스 만료 날짜</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}