import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import { CommonCodeFeedback } from '@/apps/admin/features/common-code/components/CommonCodeFeedback';
import type { DetailCode, MasterCode } from '../types';

type CommonCodeDetailTableProps = {
  selectedMaster: MasterCode | null;
  rows: DetailCode[];
  isAllChecked: boolean;
  checkedCount: number;
  onToggleRow: (detailId: string) => void;
  onToggleAllRows: () => void;
  onFieldChange: (detailId: string, key: 'code' | 'name', value: string) => void;
  onUseYnChange: (detailId: string, checked: boolean) => void;
  onAddRow: () => void;
  onDeleteRows: () => void;
};

export function CommonCodeDetailTable({
  selectedMaster,
  rows,
  isAllChecked,
  checkedCount,
  onToggleRow,
  onToggleAllRows,
  onFieldChange,
  onUseYnChange,
  onAddRow,
  onDeleteRows,
}: CommonCodeDetailTableProps) {
  return !selectedMaster ? (
    <CommonCodeFeedback />
  ) : (
    <article className="common-code-card" aria-label="공통코드 상세">
      <header className="common-code-card__header">
        <h2 className="common-code-card__title">공통코드 상세</h2>
        <div className="common-code-card__actions common-code-card__actions--detail">
          {/* 위 아래 이동 버튼 : 디테일의 순서 변경, 현재 클릭된(다수 포함)을 위 아래로 이동시킴*/}
          <Button
            variant="icon"
            size="sm"
            iconOnly={<Icon id="i-chevron-up" size={12} />}
            aria-label="위로 이동"
            disabled
          />
          <Button
            variant="icon"
            size="sm"
            iconOnly={<Icon id="i-chevron-down" size={12} />}
            aria-label="아래로 이동"
            disabled
          />
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={onAddRow}
            style={{ padding: '0 var(--spacing-button-x-sm)' }}
          >
            + 행추가
          </Button>
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={onDeleteRows}
            disabled={checkedCount === 0}
            style={{ padding: '0 var(--spacing-button-x-sm)' }}
          >
            - 행삭제
          </Button>
          <Button type="button" variant="outline" size="sm">
            저장
          </Button>
        </div>
      </header>

      <div className="common-table-wrap">
        <table className="common-table common-table--detail" aria-label="공통코드 상세 테이블">
          <colgroup>
            <col style={{ width: '3rem' }} />
            <col />
            <col />
            <col style={{ width: '8rem' }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <CheckboxInput
                  checked={isAllChecked}
                  onChange={onToggleAllRows}
                  aria-label="공통코드 상세 전체 선택"
                  size="sm"
                  className="common-table__checkbox"
                />
              </th>
              <th>공통코드</th>
              <th>공통코드명</th>
              <th>사용여부</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.checked ? 'is-selected' : undefined}>
                <td>
                  <CheckboxInput
                    checked={row.checked}
                    onChange={() => onToggleRow(row.id)}
                    aria-label={`${row.code} 선택`}
                    size="sm"
                    className="common-table__checkbox"
                  />
                </td>
                <td>
                  <InputBase
                    size="sm"
                    className="common-table__input"
                    value={row.code}
                    onChange={(event) => onFieldChange(row.id, 'code', event.target.value)}
                    aria-label={`${row.code} 코드`}
                  />
                </td>
                <td>
                  <InputBase
                    size="sm"
                    className="common-table__input"
                    value={row.name}
                    onChange={(event) => onFieldChange(row.id, 'name', event.target.value)}
                    aria-label={`${row.code} 코드명`}
                  />
                </td>
                <td>
                  <CheckboxInput
                    checked={row.useYn}
                    onChange={(checked) => onUseYnChange(row.id, checked)}
                    aria-label={`${row.code} 사용 여부`}
                    size="sm"
                    className="common-table__checkbox"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="common-code-card__footnote">
        {selectedMaster
          ? `${selectedMaster.name} 상세 코드를 편집 중입니다.`
          : '선택된 공통코드가 없습니다.'}
      </p>
    </article>
  );
}
