import { TableCard, TableCardContentState } from '@/shared/components/table';
import type { NoticeListRow } from '../types';

type NoticeListTableProps = {
  rows: NoticeListRow[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
  onRowClick: (row: NoticeListRow) => void;
};

export function NoticeListTable({
  rows,
  isLoading = false,
  isError = false,
  className,
  onRowClick,
}: NoticeListTableProps) {
  return (
    <TableCard title="공지사항 목록" ariaLabel="공지사항 목록" className={className}>
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="공지사항 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="공지사항 목록 테이블">
            <colgroup>
              <col style={{ width: '5rem' }} />
              <col />
              <col style={{ width: '10rem' }} />
              <col style={{ width: '11rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">순번</th>
                <th scope="col">제목</th>
                <th scope="col">작성자</th>
                <th scope="col">날짜</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="common-table__empty">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} onClick={() => onRowClick(row)}>
                    <td className="common-table__cell--center">{index + 1}</td>
                    <td
                      className="common-table__cell--left common-table__cell--truncate"
                      title={row.title}
                    >
                      {row.title || '-'}
                    </td>
                    <td className="common-table__cell--center">{row.registrant || '-'}</td>
                    <td className="common-table__cell--center">{row.registeredAt || '-'}</td>
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
