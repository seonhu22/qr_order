import { Button } from '@/shared/components/button';
import { TableCard, TableCardContentState } from '@/shared/components/table';
import type { PaymentRateRow } from '../types';

type PaymentManageTableProps = {
  rows: PaymentRateRow[];
  isLoading?: boolean;
  isError?: boolean;
  checkedIds: string[];
  isAllChecked: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onOpenDetail: (row: PaymentRateRow) => void;
};

export function PaymentManageTable({
  rows,
  isLoading = false,
  isError = false,
  checkedIds,
  isAllChecked,
  onToggleRow,
  onToggleAll,
  onCreate,
  onDelete,
  onOpenDetail,
}: PaymentManageTableProps) {
  return (
    <TableCard
      title="결제 요금 목록"
      ariaLabel="결제 요금 목록"
      actions={
        <>
          <Button size="sm" variant="secondary" onClick={onCreate}>
            신규
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onDelete}
            disabled={checkedIds.length === 0}
          >
            삭제
          </Button>
        </>
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="결제 요금 목록을 불러오는 중입니다."
      >
        <div className="layout-contents">
          <table className="common-table" aria-label="결제 요금 목록 테이블">
            <thead>
              <tr>
                <th scope="col" className="common-table__th common-table__th--checkbox">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={isAllChecked}
                    onChange={onToggleAll}
                  />
                </th>
                <th scope="col" className="common-table__th">결제 요금 코드</th>
                <th scope="col" className="common-table__th">결제 요금 명</th>
                <th scope="col" className="common-table__th">결제 요금</th>
                <th scope="col" className="common-table__th">결제 요금 단위</th>
                <th scope="col" className="common-table__th">라이센스 기간</th>
                <th scope="col" className="common-table__th">상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="common-table__empty">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={checkedIds.includes(row.id) ? 'is-selected' : ''}
                  >
                    <td className="common-table__td common-table__td--checkbox">
                      <input
                        type="checkbox"
                        aria-label={`${row.rateName} 선택`}
                        checked={checkedIds.includes(row.id)}
                        onChange={() => onToggleRow(row.id)}
                      />
                    </td>
                    <td className="common-table__td">{row.rateCode}</td>
                    <td className="common-table__td">{row.rateName}</td>
                    <td className="common-table__td">{row.rateAmount.toLocaleString()}</td>
                    <td className="common-table__td">{row.rateUnit}</td>
                    <td className="common-table__td">{row.licensePeriod}</td>
                    <td className="common-table__td">
                      <button
                        type="button"
                        className="common-code-card__icon-ghost"
                        aria-label={`${row.rateName} 상세 보기`}
                        onClick={() => onOpenDetail(row)}
                      >
                        상세
                      </button>
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
