import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { FeedbackState } from '@/shared/components/feedback';
import { InputBase, InputWrapper } from '@/shared/components/input';
import { TableCard } from '@/shared/components/table';
import { Icon } from '@/shared/assets/icons/Icon';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { RuleDetailColumn, RuleDetailRow, RuleMasterRow } from '../types';

type RuleDetailTableProps = {
  selectedMaster: RuleMasterRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: RuleDetailColumn[];
  rows: RuleDetailRow[];
  rowErrors: DetailRowErrorState;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSave: () => void;
};

function getStringValue(value: string | boolean | undefined) {
  return typeof value === 'string' ? value : '';
}

/**
 * 규칙 상세(하단) 테이블.
 *
 * @description
 * 저장/알림 모달은 page hook이 조율하고, 이 컴포넌트는
 * 상세 행 선택/편집 UI와 이벤트 전달만 담당한다.
 */
export function RuleDetailTable({
  selectedMaster,
  isLoading,
  isSaving,
  columns,
  rows,
  rowErrors,
  onChangeValue,
  onClearRowError,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onSave,
}: RuleDetailTableProps) {
  const [selectedDetailId, setSelectedDetailId] = useState('');

  /**
   * 현재 rows 안에 실제로 존재하는 선택값만 인정한다.
   *
   * @description
   * 마스터 변경 또는 행 삭제 후 예전 rowId가 남아 있을 수 있으므로,
   * 현재 목록에 없는 선택값은 빈 값으로 간주해 버튼 오동작을 막는다.
   */
  const effectiveSelectedDetailId = rows.some((row) => row.id === selectedDetailId)
    ? selectedDetailId
    : '';
  const selectedIndex = rows.findIndex((row) => row.id === effectiveSelectedDetailId);
  const canMoveUp = !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex > 0;
  const canMoveDown =
    !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex < rows.length - 1;
  const detailColSpan = Math.max(columns.length, 1);

  return (
    <TableCard
      title="규칙 상세"
      ariaLabel="규칙 상세"
      actionsClassName="common-code-card__actions--detail"
      actions={
        <>
          <Button
            variant="icon"
            size="sm"
            iconOnly={<Icon id="i-chevron-up" size={12} />}
            aria-label="위로 이동"
            disabled={!canMoveUp || isSaving}
            onClick={() => onMoveUp(effectiveSelectedDetailId || undefined)}
          />
          <Button
            variant="icon"
            size="sm"
            iconOnly={<Icon id="i-chevron-down" size={12} />}
            aria-label="아래로 이동"
            disabled={!canMoveDown || isSaving}
            onClick={() => onMoveDown(effectiveSelectedDetailId || undefined)}
          />
          <Button
            type="button"
            variant="text"
            size="sm"
            className="common-code-card__text-action"
            disabled={!selectedMaster || isSaving}
            onClick={onAddRow}
          >
            + 행추가
          </Button>
          <Button
            type="button"
            variant="text"
            size="sm"
            className="common-code-card__text-action"
            disabled={!selectedMaster || !effectiveSelectedDetailId || isSaving}
            onClick={() => {
              onDeleteRow(effectiveSelectedDetailId || undefined);
              setSelectedDetailId('');
            }}
          >
            - 행삭제
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isSaving}
            disabled={!selectedMaster}
            onClick={onSave}
          >
            저장
          </Button>
        </>
      }
    >
      {!selectedMaster ? (
        <FeedbackState
          variant="empty"
          title="목록을 선택해주세요"
          description="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
          className="common-code-card__empty"
        />
      ) : isLoading ? (
        <FeedbackState variant="loading" title="규칙 상세를 불러오는 중입니다." />
      ) : (
        <>
          {/* 하단 테이블은 현재 선택된 마스터의 상세 행만 보여준다. */}
          <div className="common-table-wrap">
            <table className="common-table common-table--detail" aria-label="규칙 상세 테이블">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={column.type === 'text' ? 'common-table__cell--left' : undefined}
                    >
                      {column.required ? (
                        <>
                          {column.label}
                          <span style={{ color: 'var(--color-brand-default)' }}>*</span>
                        </>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={effectiveSelectedDetailId === row.id ? 'is-selected' : undefined}
                      onMouseDown={() => setSelectedDetailId(row.id)}
                    >
                      {columns.map((column) => {
                        const value = row.values[column.key];

                        if (column.type === 'boolean') {
                          return (
                            <td key={column.key}>
                              <CheckboxInput
                                checked={Boolean(value)}
                                onChange={(checked) => onChangeValue(row.id, column.key, checked)}
                                aria-label={`${row.id} ${column.label}`}
                                size="sm"
                                className="common-table__checkbox"
                              />
                            </td>
                          );
                        }

                        const isReadonly = column.readOnlyOnExisting && !row.isNew;

                        return (
                          <td key={column.key}>
                            <InputWrapper inputId={`${row.id}-${column.key}`}>
                              <InputBase
                                id={`${row.id}-${column.key}`}
                                size="sm"
                                className={`common-table__input${isReadonly ? ' common-table__input--readonly-code' : ''}`}
                                controlState={
                                  isReadonly
                                    ? 'readonly'
                                    : rowErrors[row.id]?.[column.key]
                                      ? 'error'
                                      : ''
                                }
                                readOnly={isReadonly}
                                value={getStringValue(value)}
                                onChange={(event) => {
                                  // 다시 입력을 시작하면 해당 필드 에러 표시를 해제한다.
                                  onClearRowError(row.id, column.key);
                                  onChangeValue(row.id, column.key, event.target.value);
                                }}
                                aria-label={`${row.id} ${column.label}`}
                              />
                            </InputWrapper>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="common-table__empty" colSpan={detailColSpan}>
                      상세 항목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="common-code-card__footnote">
            {`${selectedMaster.name} 상세 규칙을 편집 중입니다.`}
          </p>
        </>
      )}
    </TableCard>
  );
}
