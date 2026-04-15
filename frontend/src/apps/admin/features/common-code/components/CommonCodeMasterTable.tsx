/**
 * @fileoverview 공통코드 마스터 테이블 UI
 *
 * @description
 * - 마스터 목록 조회 결과를 테이블로 렌더링한다.
 * - 실제 서버 저장/삭제와 모달 흐름은 상위 page hook에 위임한다.
 */

import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { Icon } from '@/shared/assets/icons/Icon';
import type { MasterCode } from '../types';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';

type CommonCodeMasterTableProps = {
  rows: MasterCode[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: MasterCode) => void;
  onDelete: () => void;
};

/**
 * 공통코드 마스터 테이블을 렌더링한다.
 *
 * @description
 * - 저장/삭제 모달은 page가 조립하고, 이 컴포넌트는 목록 렌더링과 이벤트 전달만 담당한다.
 */
export function CommonCodeMasterTable({
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
}: CommonCodeMasterTableProps) {
  const headerActions = (
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
  );

  return (
    <>
      <TableCard title="공통코드 마스터" ariaLabel="공통코드 마스터" actions={headerActions}>
        {isLoading ? (
          <FeedbackState variant="loading" title="공통코드 목록을 불러오는 중입니다." />
        ) : isError ? (
          <FeedbackState variant="error" title="불러오는데 실패했습니다." description="다시 한번 시도해주세요." />
        ) : (
        <div className="common-table-wrap">
          <table className="common-table" aria-label="공통코드 마스터 테이블">
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
                    aria-label="공통코드 마스터 전체 선택"
                    size="sm"
                    className="common-table__checkbox"
                  />
                </th>
                <th className="common-table__cell--left">공통코드</th>
                <th className="common-table__cell--left">공통코드명</th>
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

    </>
  );
}
