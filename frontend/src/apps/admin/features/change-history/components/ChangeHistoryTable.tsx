import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import { getAuditFlagClassName, getAuditFlagLabel } from '../constants/changeHistoryAuditFlag';
import { ChangeHistoryContents } from './ChangeHistoryContents';
import type { ChangeHistoryRow } from '../types';

type ChangeHistoryTableProps = {
  rows: ChangeHistoryRow[];
  isLoading: boolean;
  isError: boolean;
};

export function ChangeHistoryTable({ rows, isLoading, isError }: ChangeHistoryTableProps) {
  return (
    <TableCard title="변경 이력 목록" ariaLabel="변경 이력 목록" className="change-history-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="변경 이력을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table">
            <colgroup>
              <col className="common-table__col--md" />
              <col className="change-history-table__col--menu" />
              <col />
              <col className="change-history-table__col--date" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">변경 구분</th>
                <th scope="col">메뉴명</th>
                <th scope="col">수정내용</th>
                <th scope="col">수정일자</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="common-table__empty">조회 결과가 없습니다.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`change-history-flag-badge ${getAuditFlagClassName(row.auditFlag)}`}>
                        {getAuditFlagLabel(row.auditFlag)}
                      </span>
                    </td>
                    <td className="change-history-table__cell--menu" title={row.menuNm}>{row.menuNm}</td>
                    <td className="change-history-table__cell--contents" title={row.auditTrailContents}>
                      <ChangeHistoryContents contents={row.auditTrailContents} />
                    </td>
                    <td className="common-table__cell--center change-history-table__cell--date">
                      {row.insertDatetime}
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
