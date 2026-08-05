import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import { useClickableRow } from '@/shared/hooks/useClickableRow';
import type { AccessLogMasterRow } from '../types';

type AccessLogMasterTableProps = {
  rows: AccessLogMasterRow[];
  isLoading: boolean;
  isError: boolean;
  selectedId: string;
  onSelectRow: (row: AccessLogMasterRow) => void;
};

export function AccessLogMasterTable({
  rows,
  isLoading,
  isError,
  selectedId,
  onSelectRow,
}: AccessLogMasterTableProps) {
  const { getRowProps } = useClickableRow<AccessLogMasterRow>(onSelectRow);

  return (
    <TableCard title="접속 로그 목록" ariaLabel="접속 로그 목록" className="access-log-master-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="접속 로그를 불러오는 중입니다."
      >
        <div className="common-table-wrap access-log-table__wrap">
          <table className="common-table">
            <colgroup>
              <col className="common-table__col--md" />
              <col className="common-table__col--md" />
              <col />
              <col className="common-table__col--xl" />
              <col className="common-table__col--xl" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">사용자 ID</th>
                <th scope="col">사용자명</th>
                <th scope="col">IP 주소</th>
                <th scope="col" className="common-table__cell--nowrap">로그인 일시</th>
                <th scope="col" className="common-table__cell--nowrap">로그아웃 일시</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="common-table__empty">조회 결과가 없습니다.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.id === selectedId ? 'is-selected' : undefined}
                    {...getRowProps(row, `${row.userId} 접속 이력 상세 보기`)}
                  >
                    <td>{row.userId}</td>
                    <td className="common-table__cell--center">{row.userNm}</td>
                    <td className="common-table__cell--center">{row.ipAddress}</td>
                    <td className="common-table__cell--center common-table__cell--nowrap">{row.loginDatetime}</td>
                    <td className="common-table__cell--center common-table__cell--nowrap">{row.logoutDatetime}</td>
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