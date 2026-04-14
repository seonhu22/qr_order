import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
import { Icon } from '@/shared/assets/icons/Icon';
import type { RuleMasterRow } from '../types';

type RuleMasterTableProps = {
  rows: RuleMasterRow[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: RuleMasterRow) => void;
  onDelete: () => void;
};

/**
 * 규칙 관리의 마스터(상단) 테이블.
 *
 * @description
 * 페이지 레벨에서 조율되는 flow를 기준으로, 이 컴포넌트는
 * 목록 렌더링과 신규/수정/삭제 이벤트 전달만 담당한다.
 */
export function RuleMasterTable({
  rows,
  isLoading,
  isError,
  selectedMasterId,
  checkedMasterIds,
  isAllChecked,
  onSelectRow,
  onToggleRow,
  onToggleAllRows,
  onCreate,
  onEdit,
  onDelete,
}: RuleMasterTableProps) {
  return (
    <TableCard
      title="규칙 목록"
      ariaLabel="규칙 목록"
      actions={
        <>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Icon id="i-plus" size={13} />}
            onClick={onCreate}
          >
            신규
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDelete}>
            삭제
          </Button>
        </>
      }
    >
      {isLoading ? (
        <FeedbackState variant="loading" title="규칙 목록을 불러오는 중입니다." />
      ) : isError ? (
        <FeedbackState variant="error" description="다시 한번 시도해주세요." />
      ) : (
        /* 상단 테이블은 목록 표시와 클릭 이벤트 전달만 담당한다.
           저장/삭제 모달은 페이지에서 조립한다. */
        <div className="common-table-wrap">
          <table className="common-table" aria-label="규칙 목록 테이블">
            <colgroup>
              <col style={{ width: '3rem' }} />
              <col />
              <col />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '4rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <CheckboxInput
                    checked={isAllChecked}
                    onChange={onToggleAllRows}
                    aria-label="규칙 목록 전체 선택"
                    size="sm"
                    className="common-table__checkbox"
                  />
                </th>
                <th className="common-table__cell--left">규칙코드</th>
                <th className="common-table__cell--left">규칙명</th>
                <th>사용여부</th>
                <th aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedMasterId === row.id;
                const isChecked = checkedMasterIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className={isSelected ? 'is-selected' : undefined}
                    onClick={() => onSelectRow(row.id)}
                  >
                    <td>
                      <CheckboxInput
                        checked={isChecked}
                        onChange={() => onToggleRow(row.id)}
                        aria-label={`${row.code} 선택`}
                        size="sm"
                        className="common-table__checkbox"
                      />
                    </td>
                    <td className="common-table__mono common-table__cell--left">{row.code}</td>
                    <td className="common-table__cell--left">{row.name}</td>
                    <td>
                      <span
                        className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}
                      >
                        {row.useYn}
                      </span>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="icon"
                        size="sm"
                        iconOnly={<Icon id="i-modal-pencil" size={12} />}
                        aria-label={`${row.code} 수정`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(row);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}
