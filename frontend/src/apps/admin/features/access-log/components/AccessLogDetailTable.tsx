import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import type { AccessLogDetailRow, AccessLogMasterRow } from '../types';

type AccessLogDetailTableProps = {
  rows: AccessLogDetailRow[];
  isLoading: boolean;
  isError: boolean;
  selectedRow: AccessLogMasterRow | null;
};

export function AccessLogDetailTable({
  rows,
  isLoading,
  isError,
  selectedRow,
}: AccessLogDetailTableProps) {
  const userBadge = selectedRow && (
    <span className="access-log-table__user-badge">
      {selectedRow.userNm} {selectedRow.userId}
    </span>
  );

  return (
    <TableCard
      title="메뉴 접근 목록"
      ariaLabel="메뉴 접근 목록"
      actions={userBadge || undefined}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && !selectedRow}
        loadingTitle="메뉴 접근 목록을 불러오는 중입니다."

        emptyVariant="select"
        emptyDescription="좌측 목록에서 항목을 선택하면 메뉴 접근 이력을 조회할 수 있습니다."
      >
        <div className="common-table-wrap access-log-table__wrap">
          <table className="common-table">
            <thead>
              <tr>
                <th scope="col">메뉴코드</th>
                <th scope="col">메뉴명</th>
                <th scope="col">시작 일시</th>
                <th scope="col">종료 일시</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="common-table__empty">접근한 메뉴 이력이 없습니다.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.menuCd}</td>
                    <td>{row.menuNm}</td>
                    <td className="common-table__cell--center">{row.menuOpenDatetime}</td>
                    <td className="common-table__cell--center">{row.menuCloseDatetime}</td>
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
