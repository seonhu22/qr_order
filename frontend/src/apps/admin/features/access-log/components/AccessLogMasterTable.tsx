import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
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
  return (
    <TableCard title="접속 로그 목록" ariaLabel="접속 로그 목록">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && rows.length === 0}
        loadingTitle="접속 로그를 불러오는 중입니다."
        errorDescription="다시 한번 시도해주세요."
        emptyDescription="조회 조건을 설정하고 조회 버튼을 눌러주세요."
      >
        <div className="common-table-wrap access-log-table__wrap">
          <table className="common-table">
            <thead>
              <tr>
                <th className="common-table__th" scope="col">사용자 ID</th>
                <th className="common-table__th" scope="col">사용자명</th>
                <th className="common-table__th" scope="col">IP 주소</th>
                <th className="common-table__th" scope="col">로그인 일시</th>
                <th className="common-table__th" scope="col">로그아웃 일시</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`common-table__row${row.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onSelectRow(row)}
                >
                  <td className="common-table__td">{row.userId}</td>
                  <td className="common-table__td">{row.userNm}</td>
                  <td className="common-table__td">{row.ipAddress}</td>
                  <td className="common-table__td">{row.loginDatetime}</td>
                  <td className="common-table__td">{row.logoutDatetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}