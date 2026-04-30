import { EditTableButton } from '@/shared/components/button';
import { MasterTableActions, TableCard, TableCardContentState } from '@/shared/components/table';
import { CheckboxInput } from '@/shared/components/checkbox/CheckboxInput';
import type { PaymentRateRow } from '../types';

function PaymentUnitBadge({ unit }: { unit: string }) {
  if (unit === '원') {
    return <span className="status-badge status-badge--krw">원 <span className="payment-unit-badge__symbol">₩</span></span>;
  }
  if (unit === '달러' || unit === 'USD') {
    return <span className="status-badge status-badge--usd">달러 <span className="payment-unit-badge__symbol">$</span></span>;
  }
  return <span className="status-badge">{unit}</span>;
}

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
  onEdit: (row: PaymentRateRow) => void;
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
  onEdit,
}: PaymentManageTableProps) {
  return (
    <TableCard
      title="결제 요금 목록"
      ariaLabel="결제 요금 목록"
      actions={
        <MasterTableActions onCreate={onCreate} onDelete={onDelete} />
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="결제 요금 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table payment-manage-table" aria-label="결제 요금 목록 테이블">
            <colgroup>
              <col className="common-table__col--checkbox" /><col /><col /><col /><col /><col /><col className="common-table__col--action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" aria-label="선택">
                  <span className="common-table__checkbox">
                    <CheckboxInput
                      size="sm"
                      checked={isAllChecked}
                      indeterminate={checkedIds.length > 0 && !isAllChecked}
                      aria-label="전체 선택"
                      onChange={onToggleAll}
                    />
                  </span>
                </th>
                <th scope="col">결제 요금 코드</th>
                <th scope="col">결제 요금 명</th>
                <th scope="col">결제 요금</th>
                <th scope="col">결제 요금 단위</th>
                <th scope="col">라이센스 기간</th>
                <th scope="col" aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="common-table__empty">데이터가 없습니다.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="common-table__checkbox">
                        <CheckboxInput
                          size="sm"
                          checked={checkedIds.includes(row.id)}
                          aria-label={`${row.rateName} 선택`}
                          onChange={() => onToggleRow(row.id)}
                        />
                      </span>
                    </td>
                    <td
                      className="common-table__mono common-table__cell--truncate"
                      title={row.rateCode}
                    >
                      {row.rateCode}
                    </td>
                    <td
                      className="common-table__cell--left common-table__cell--truncate"
                      title={row.rateName}
                    >
                      {row.rateName}
                    </td>
                    <td>{row.rateAmount.toLocaleString()}</td>
                    <td className="common-table__cell--center"><PaymentUnitBadge unit={row.rateUnit} /></td>
                    <td className="common-table__cell--center">{row.licenseValidMonth}개월</td>
                    <td>
                      <EditTableButton
                        ariaLabel={`${row.rateName} 수정`}
                        onClick={() => onEdit(row)}
                      />
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
