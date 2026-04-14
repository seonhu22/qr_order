import { useMemo, useState } from 'react';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { FeedbackState } from '@/shared/components/feedback';
import { InputBase, InputWrapper } from '@/shared/components/input';
import { SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { TableCard } from '@/shared/components/table';
import { Icon } from '@/shared/assets/icons/Icon';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import type { RuleDetailColumn, RuleDetailRow, RuleMasterRow } from '../types';

/**
 * 규칙 상세 테이블 Props.
 *
 * @description
 * 상세 데이터의 소유권은 상위 훅(useRuleManagementPage)에 있고,
 * 이 컴포넌트는 편집 UI와 이벤트 전달 계약만 담당한다.
 */
type RuleDetailTableProps = {
  selectedMaster: RuleMasterRow | null;
  isLoading: boolean;
  isSaving: boolean;
  columns: RuleDetailColumn[];
  rows: RuleDetailRow[];
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSaveRows: () => Promise<boolean>;
};

/**
 * Input 렌더링용 안전 문자열 변환.
 *
 * @description
 * 상세 값은 string | boolean이므로, text input에는 string만 주입한다.
 */
function getStringValue(value: string | boolean | undefined) {
  return typeof value === 'string' ? value : '';
}

/**
 * 규칙 상세(하단) 테이블.
 *
 * @description
 * - 행 선택/순서 이동/인라인 편집을 제공한다.
 * - 저장 확인/완료 알림 플로우는 useDetailTableSaveFlow에 위임한다.
 */
export function RuleDetailTable({
  selectedMaster,
  isLoading,
  isSaving,
  columns,
  rows,
  onChangeValue,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onSaveRows,
}: RuleDetailTableProps) {
  const [selectedDetailId, setSelectedDetailId] = useState('');

  const selectedIndex = rows.findIndex((row) => row.id === selectedDetailId);
  const canMoveUp = !!selectedMaster && selectedDetailId !== '' && selectedIndex > 0;
  const canMoveDown =
    !!selectedMaster && selectedDetailId !== '' && selectedIndex < rows.length - 1;
  const detailColSpan = Math.max(columns.length, 1);

  /**
   * 저장 전 필수값 검증 함수.
   *
   * @description
   * required text 컬럼만 검사해 rowId -> columnKey 단위 에러 맵을 만든다.
   */
  const validateRows = useMemo(
    () => () =>
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          Object.fromEntries(
            columns
              .filter((column) => column.type === 'text' && column.required)
              .map((column) => [column.key, !getStringValue(row.values[column.key]).trim()]),
          ),
        ]),
      ),
    [columns, rows],
  );

  const {
    rowErrors,
    notice,
    isSaveConfirmOpen,
    isConfirming,
    clearRowError,
    requestSave,
    confirmSave,
    closeSaveConfirm,
    closeNotice,
  } = useDetailTableSaveFlow({
    validateRows,
    onSaveRows,
  });

  return (
    <>
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
              onClick={() => onMoveUp(selectedDetailId || undefined)}
            />
            <Button
              variant="icon"
              size="sm"
              iconOnly={<Icon id="i-chevron-down" size={12} />}
              aria-label="아래로 이동"
              disabled={!canMoveDown || isSaving}
              onClick={() => onMoveDown(selectedDetailId || undefined)}
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
              disabled={!selectedMaster || !selectedDetailId || isSaving}
              onClick={() => {
                onDeleteRow(selectedDetailId || undefined);
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
              onClick={requestSave}
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
                        className={selectedDetailId === row.id ? 'is-selected' : undefined}
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
                                    clearRowError(row.id, column.key);
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

      <SimpleDefaultModal
        open={!!notice}
        title={notice?.title ?? '알림'}
        description={notice?.description}
        onClose={closeNotice}
      />

      <SaveConfirmModal
        open={isSaveConfirmOpen}
        title="저장하시겠습니까?"
        description="작성된 규칙 상세를 저장하시겠습니까?"
        primaryAction={{ label: '확인', loading: isConfirming, onClick: confirmSave }}
        secondaryAction={{ disabled: isConfirming, onClick: closeSaveConfirm }}
        onClose={closeSaveConfirm}
      />
    </>
  );
}
