import { TableCard } from '@/shared/components/table';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import type { ChangeHistoryRow } from '../types';

const AUDIT_FLAG_LABEL: Record<string, string> = {
  I: '등록',
  U: '수정',
  D: '삭제',
};

type ChangeHistoryTableProps = {
  rows: ChangeHistoryRow[];
  isLoading: boolean;
  isError: boolean;
};

export function ChangeHistoryTable({ rows, isLoading, isError }: ChangeHistoryTableProps) {
  return (
    <TableCard title="변경 이력 목록" ariaLabel="변경 이력 목록">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && rows.length === 0}
        loadingTitle="변경 이력을 불러오는 중입니다."
        errorDescription="다시 한번 시도해주세요."
        emptyDescription="조회 조건을 설정하고 조회 버튼을 눌러주세요."
      >
        <div className="common-table-wrap">
          <table className="common-table">
            <colgroup>
              <col className="common-table__col--md" /><col /><col /><col />
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={`change-history-flag-badge change-history-flag-badge--${row.auditFlag.toLowerCase()}`}>
                      {AUDIT_FLAG_LABEL[row.auditFlag] ?? row.auditFlag}
                    </span>
                  </td>
                  <td>{row.menuNm}</td>
                  <td>{row.auditTrailContents}</td>
                  <td className="common-table__cell--center">{row.insertDatetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
