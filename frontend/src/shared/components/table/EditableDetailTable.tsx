import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FeedbackVariant } from '@/shared/components/feedback';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import { getNextSelectedId } from '@/shared/utils/rowSelection';
import { DetailTableActions } from './TableActionGroups';
import { TableBodyRenderer } from './TableBodyRenderer';
import { TableCard } from './TableCard';
import { TableCardContentState } from './TableCardContentState';
import type {
  EditableDetailColumn,
  EditableDetailMasterRow,
  EditableDetailRow,
} from './editableTableTypes';
import type { SharedTableColumn, SharedTableRow } from './tableModelTypes';

type EditableDetailTableProps<
  TMaster extends EditableDetailMasterRow,
  TRow extends EditableDetailRow,
> = {
  table: {
    title?: string;
    /** 제목 옆(헤더 액션 영역)에 표시할 배지 — 선택된 마스터 라벨 등 */
    titleBadge?: ReactNode;
    ariaLabel: string;
    tableAriaLabel: string;
    footnote?: string;
    emptyRowsText?: string;
  };
  statusText: {
    loadingTitle: string;
    emptyVariant?: FeedbackVariant;
    emptyDescription?: string;
  };
  data: {
    selectedMaster: TMaster | null;
    rows: TRow[];
    columns: EditableDetailColumn[];
    rowErrors: DetailRowErrorState;
  };
  status: {
    isLoading: boolean;
    isSaving: boolean;
  };
  getInputAriaLabel?: (row: TRow, column: EditableDetailColumn) => string;
  actions: {
    showMoveActions?: boolean;
    onChangeValue: (rowId: string, columnKey: string, value: string | boolean) => void;
    onClearRowError: (rowId: string, columnKey: string) => void;
    onAddRow: () => string;
    onDeleteRow: (rowId?: string) => void;
    onMoveUp: (rowId?: string) => void;
    onMoveDown: (rowId?: string) => void;
    onSave: () => void;
    /** type: 'action' 컬럼의 행 단위 버튼 클릭 핸들러. */
    onEditRow?: (row: TRow) => void;
  };
};

/**
 * 상세 테이블, CRUD 화면의 상세 행 편집 테이블을 공통화한 컴포넌트.
 *
 * @description
 * 선택된 마스터 기준으로 상세 행 목록을 렌더링하고,
 * 행 선택·필드 편집·행 이동·저장 이벤트를 표준화된 테이블 모델로 변환해 처리한다.
 */
export function EditableDetailTable<
  TMaster extends EditableDetailMasterRow,
  TRow extends EditableDetailRow,
>({
  table,
  statusText,
  data,
  status,
  getInputAriaLabel,
  actions,
}: EditableDetailTableProps<TMaster, TRow>) {
  const {
    title,
    titleBadge,
    ariaLabel,
    tableAriaLabel,
    footnote,
    emptyRowsText = '상세 항목이 없습니다.',
  } = table;
  const {
    loadingTitle,
    emptyVariant = 'select',
    emptyDescription,
  } = statusText;
  const { selectedMaster, rows, columns, rowErrors } = data;
  const { isLoading, isSaving } = status;
  const {
    showMoveActions = true,
    onChangeValue,
    onClearRowError,
    onAddRow,
    onDeleteRow,
    onMoveUp,
    onMoveDown,
    onSave,
    onEditRow,
  } = actions;
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const effectiveSelectedDetailId = rows.some((row) => row.id === selectedDetailId)
    ? selectedDetailId
    : '';

  /**
   * 행추가 버튼으로 발생한 선택 변경인지 추적한다.
   * 클릭으로 행을 선택할 때는 스크롤하지 않고, 행추가 시에만 스크롤하기 위해 사용한다.
   */
  const shouldScrollRef = useRef(false);
  /** 테이블 본문 영역의 DOM 참조. 선택 행 스크롤 대상을 좁히기 위해 사용한다. */
  const tableBodyRef = useRef<HTMLDivElement>(null);

  /**
   * 행추가로 새 행이 DOM에 반영된 뒤 해당 행이 보이도록 스크롤한다.
   * effectiveSelectedDetailId가 바뀔 때만 실행되며,
   * shouldScrollRef가 true일 때(행추가 직후)에만 실제로 스크롤한다.
   */
  useEffect(() => {
    if (!shouldScrollRef.current || !effectiveSelectedDetailId || !tableBodyRef.current) return;
    shouldScrollRef.current = false;
    const selectedRow = tableBodyRef.current.querySelector('tr.is-selected');
    selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [effectiveSelectedDetailId]);
  const selectedIndex = rows.findIndex((row) => row.id === effectiveSelectedDetailId);
  const canMoveUp = !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex > 0;
  const canMoveDown =
    !!selectedMaster && effectiveSelectedDetailId !== '' && selectedIndex < rows.length - 1;
  const tableColumns: SharedTableColumn[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    required: column.required,
    className: column.className,
    tdClassName: column.className,
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

        if (column.type === 'select') {
          return [
            column.key,
            {
              type: 'select',
              value: typeof value === 'string' ? value : '',
              options: column.options ?? [],
              isError: Boolean(rowErrors[row.id]?.[column.key]),
              onChange: (nextValue: string) => onChangeValue(row.id, column.key, nextValue),
            },
          ];
        }

        if (column.type === 'action') {
          return [
            column.key,
            {
              type: 'editButton',
              ariaLabel,
              onClick: (event) => {
                event.stopPropagation();
                onEditRow?.(row);
              },
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
            inputType: column.inputType,
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
      title={
        titleBadge ? (
          <>
            {title}
            {titleBadge}
          </>
        ) : (
          title
        )
      }
      ariaLabel={ariaLabel}
      actionsClassName="common-code-card__actions--detail"
      actions={
        selectedMaster ? (
          <DetailTableActions
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            canDelete={!!effectiveSelectedDetailId}
            isSaving={isSaving}
            showMoveActions={showMoveActions}
            onMoveUp={() => onMoveUp(effectiveSelectedDetailId || undefined)}
            onMoveDown={() => onMoveDown(effectiveSelectedDetailId || undefined)}
            onAddRow={() => {
              shouldScrollRef.current = true;
              setSelectedDetailId(onAddRow());
            }}
            onDeleteRow={() => {
              const nextSelectedId = getNextSelectedId(rows, effectiveSelectedDetailId);
              onDeleteRow(effectiveSelectedDetailId || undefined);
              setSelectedDetailId(nextSelectedId);
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
        emptyVariant={emptyVariant}
        emptyDescription={emptyDescription}
        emptyClassName="common-code-card__empty"
      >
        <>
          {/* layout-contents: display:contents 로 레이아웃에 투명 — common-table-wrap 이 직접 flex 자식이 된다 */}
          <div ref={tableBodyRef} className="layout-contents">
            <TableBodyRenderer
              tableAriaLabel={tableAriaLabel}
              tableClassName="common-table common-table--detail"
              columns={tableColumns}
              rows={tableRows}
              emptyMessage={emptyRowsText}
            />
          </div>
          {footnote ? <p className="common-code-card__footnote">{footnote}</p> : null}
        </>
      </TableCardContentState>
    </TableCard>
  );
}
