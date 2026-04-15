import { useState } from 'react';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import { DetailTableActions } from './TableActionGroups';
import { TableBodyRenderer } from './TableBodyRenderer';
import { TableCard } from './TableCard';
import { TableCardContentState } from './TableCardContentState';
import type {
  EditableDetailColumn,
  EditableDetailRow,
  EditableMasterRow,
} from './editableTableTypes';
import type { SharedTableColumn, SharedTableRow } from './tableModelTypes';

type EditableDetailTableProps<TMaster extends EditableMasterRow, TRow extends EditableDetailRow> = {
  title?: string;
  ariaLabel: string;
  tableAriaLabel: string;
  loadingTitle: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyRowsText?: string;
  selectedMaster: TMaster | null;
  rows: TRow[];
  columns: EditableDetailColumn[];
  isLoading: boolean;
  isSaving: boolean;
  rowErrors: DetailRowErrorState;
  footnote?: string;
  getInputAriaLabel?: (row: TRow, column: EditableDetailColumn) => string;
  onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
  onClearRowError: (rowId: string, columnKey: string) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId?: string) => void;
  onMoveUp: (rowId?: string) => void;
  onMoveDown: (rowId?: string) => void;
  onSave: () => void;
};

/**
 * 상세 테이블 액션 영역에서 사용하는 버튼 상태/핸들러 계약.
 */
type DetailTableActionsProps = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
  isSaving: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

/**
 * 상세 테이블, CRUD 화면의 상세 행 편집 테이블을 공통화한 컴포넌트.
 *
 * @description
 * 선택된 마스터 기준으로 상세 행 목록을 렌더링하고,
 * 행 선택·필드 편집·행 이동·저장 이벤트를 표준화된 테이블 모델로 변환해 처리한다.
 */
export function EditableDetailTable<
  TMaster extends EditableMasterRow,
  TRow extends EditableDetailRow,
>({
  title,
  ariaLabel,
  tableAriaLabel,
  loadingTitle,
  emptyTitle = '목록을 선택해주세요',
  emptyDescription = '위 목록에서 행을 클릭하면 상세 코드가 표시됩니다.',
  emptyRowsText = '상세 항목이 없습니다.',
  selectedMaster,
  rows,
  columns,
  isLoading,
  isSaving,
  rowErrors,
  footnote,
  getInputAriaLabel,
  onChangeValue,
  onClearRowError,
  onAddRow,
  onDeleteRow,
  onMoveUp,
  onMoveDown,
  onSave,
}: EditableDetailTableProps<TMaster, TRow>) {
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const effectiveSelectedDetailId = rows.some((row) => row.id === selectedDetailId)
    ? selectedDetailId
    : '';
  const selectedIndex = rows.findIndex((row) => row.id === effectiveSelectedDetailId);
  const canMoveUp = !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex > 0;
  const canMoveDown =
    !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex < rows.length - 1;
  const tableColumns: SharedTableColumn[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    required: column.required,
    align: column.type === 'text' ? 'left' : undefined,
  }));
  const tableRows: SharedTableRow[] = rows.map((row) => ({
    id: row.id,
    selected: effectiveSelectedDetailId === row.id,
    selectOn: 'mouseDown',
    onSelect: () => setSelectedDetailId(row.id),
    cells: Object.fromEntries(
      columns.map((column) => {
        const value = row.values[column.key];
        const ariaLabel = getInputAriaLabel?.(row, column) ?? `${row.id} ${column.label}`;

        if (column.type === 'boolean') {
          return [
            column.key,
            {
              type: 'checkbox',
              checked: Boolean(value),
              ariaLabel,
              onChange: (checked: boolean) => onChangeValue(row.id, column.key, checked),
            },
          ];
        }

        const isReadonly = column.readOnlyOnExisting && !row.isNew;

        return [
          column.key,
          {
            type: 'input',
            inputId: `${row.id}-${column.key}`,
            className: `common-table__input${isReadonly ? ' common-table__input--readonly-code' : ''}`,
            controlState: isReadonly ? 'readonly' : rowErrors[row.id]?.[column.key] ? 'error' : '',
            readOnly: isReadonly,
            value: typeof value === 'string' ? value : '',
            ariaLabel,
            onClearError: () => onClearRowError(row.id, column.key),
            onChange: (nextValue: string) => onChangeValue(row.id, column.key, nextValue),
          },
        ];
      }),
    ) as SharedTableRow['cells'],
  }));

  return (
    <TableCard
      title={title}
      ariaLabel={ariaLabel}
      actionsClassName="common-code-card__actions--detail"
      actions={
        selectedMaster ? (
          <DetailTableActions
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            canDelete={!!effectiveSelectedDetailId}
            isSaving={isSaving}
            onMoveUp={() => onMoveUp(effectiveSelectedDetailId || undefined)}
            onMoveDown={() => onMoveDown(effectiveSelectedDetailId || undefined)}
            onAddRow={onAddRow}
            onDeleteRow={() => {
              onDeleteRow(effectiveSelectedDetailId || undefined);
              setSelectedDetailId('');
            }}
            onSave={onSave}
          />
        ) : undefined
      }
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={false}
        isEmpty={!selectedMaster}
        loadingTitle={loadingTitle}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyClassName="common-code-card__empty"
      >
        <>
          <TableBodyRenderer
            tableAriaLabel={tableAriaLabel}
            tableClassName="common-table common-table--detail"
            columns={tableColumns}
            rows={tableRows}
            emptyMessage={emptyRowsText}
          />
          {footnote ? <p className="common-code-card__footnote">{footnote}</p> : null}
        </>
      </TableCardContentState>
    </TableCard>
  );
}
