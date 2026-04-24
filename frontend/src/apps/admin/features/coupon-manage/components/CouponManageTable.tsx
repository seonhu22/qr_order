import { EditTableButton } from '@/shared/components/button';
import { MasterTableActions, TableCard, TableCardContentState } from '@/shared/components/table';
import { CheckboxInput } from '@/shared/components/checkbox/CheckboxInput';
import type { CouponRow } from '../types';

const USE_YN_LABEL: Record<'Y' | 'N', string> = { Y: '사용', N: '미사용' };

type CouponManageTableProps = {
  rows: CouponRow[];
  isLoading?: boolean;
  isError?: boolean;
  checkedIds: string[];
  isAllChecked: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onEdit: (row: CouponRow) => void;
};

export function CouponManageTable({
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
}: CouponManageTableProps) {
  return (
    <TableCard
      title="쿠폰 목록"
      ariaLabel="쿠폰 목록"
      actions={
        <MasterTableActions onCreate={onCreate} onDelete={onDelete} />
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && rows.length === 0}
        loadingTitle="쿠폰 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table coupon-manage-table" aria-label="쿠폰 목록 테이블">
            <colgroup>
              <col className="common-table__col--checkbox" />
              <col />
              <col />
              <col />
              <col />
              <col className="common-table__col--md" />
              <col className="common-table__col--action" />
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
                <th scope="col">쿠폰 코드</th>
                <th scope="col">쿠폰 명</th>
                <th scope="col">쿠폰 적용 일자</th>
                <th scope="col">쿠폰 종료 일자</th>
                <th scope="col">사용 여부</th>
                <th scope="col" aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="common-table__checkbox">
                      <CheckboxInput
                        size="sm"
                        checked={checkedIds.includes(row.id)}
                        aria-label={`${row.couponNm} 선택`}
                        onChange={() => onToggleRow(row.id)}
                      />
                    </span>
                  </td>
                  <td className="common-table__mono">{row.couponCd || '-'}</td>
                  <td>{row.couponNm || '-'}</td>
                  <td className="common-table__cell--center">{row.startDate || '-'}</td>
                  <td className="common-table__cell--center">{row.endDate || '-'}</td>
                  <td>
                    <span className={`coupon-use-yn-badge coupon-use-yn-badge--${row.useYn === 'Y' ? 'active' : 'inactive'}`}>
                      {USE_YN_LABEL[row.useYn]}
                    </span>
                  </td>
                  <td>
                    <EditTableButton
                      ariaLabel={`${row.couponNm} 수정`}
                      onClick={() => onEdit(row)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}