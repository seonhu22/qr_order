import type { ReactNode } from 'react';
import {
  EmptyTableRow,
  SelectableTableRow,
  TableHeaderCell,
} from '@/shared/components/table/TableBodyParts';
import {
  TableCellChangeTypeBadge,
  TableCellCheckbox,
  TableCellEditButton,
  TableCellExpirationStatusBadge,
  TableCellInput,
  TableCellLicensePeriodBadge,
  TableCellPasswordResetButton,
  TableCellSelect,
  TableCellUseYnBadge,
} from '@/shared/components/table/TableCells';
import type {
  ChangeTypeBadgeCellModel,
  CheckboxCellModel,
  CustomCellModel,
  EditButtonCellModel,
  ExpirationStatusBadgeCellModel,
  InputCellModel,
  LicensePeriodBadgeCellModel,
  PasswordResetButtonCellModel,
  SelectCellModel,
  SharedTableCell,
  SharedTableColumn,
  SharedTableRow,
  TableColumnAlign,
  TextCellModel,
  UseYnBadgeCellModel,
} from '@/shared/components/table/tableModelTypes';

type TableBodyRendererProps = {
  tableAriaLabel: string;
  columns: SharedTableColumn[];
  rows: SharedTableRow[];
  tableClassName?: string;
  emptyMessage?: string;
  colGroup?: ReactNode;
  headerCellOverrides?: Partial<Record<string, SharedTableCell>>;
};

function getAlignClassName(align?: TableColumnAlign) {
  if (align === 'left') {
    return 'common-table__cell--left';
  }

  if (align === 'right') {
    return 'common-table__cell--right';
  }

  return undefined;
}

type BuiltInSharedTableCell = Exclude<SharedTableCell, CustomCellModel>;

type CellRendererMap = {
  [K in BuiltInSharedTableCell['type']]: (
    cell: Extract<BuiltInSharedTableCell, { type: K }>,
  ) => ReactNode;
};

const cellRenderers: CellRendererMap = {
  text: (cell: TextCellModel) => (
    <span className={cell.className} title={cell.title}>
      {cell.value}
    </span>
  ),
  input: (cell: InputCellModel) => (
    <TableCellInput
      inputId={cell.inputId}
      value={cell.value}
      ariaLabel={cell.ariaLabel}
      placeholder={cell.placeholder}
      className={cell.className}
      controlState={cell.controlState}
      readOnly={cell.readOnly}
      onChange={cell.onChange}
      onClearError={cell.onClearError}
    />
  ),
  checkbox: (cell: CheckboxCellModel) => (
    <TableCellCheckbox
      checked={cell.checked}
      ariaLabel={cell.ariaLabel}
      className={cell.className}
      onChange={cell.onChange}
    />
  ),
  select: (cell: SelectCellModel) => (
    <TableCellSelect
      value={cell.value}
      options={cell.options}
      placeholder={cell.placeholder}
      className={cell.className}
      isError={cell.isError}
      searchable={cell.searchable}
      onChange={cell.onChange}
    />
  ),
  editButton: (cell: EditButtonCellModel) => (
    <TableCellEditButton ariaLabel={cell.ariaLabel} onClick={cell.onClick} />
  ),
  passwordResetButton: (cell: PasswordResetButtonCellModel) => (
    <TableCellPasswordResetButton disabled={cell.disabled} onClick={cell.onClick} />
  ),
  useYnBadge: (cell: UseYnBadgeCellModel) => <TableCellUseYnBadge value={cell.value} />,
  changeTypeBadge: (cell: ChangeTypeBadgeCellModel) => (
    <TableCellChangeTypeBadge value={cell.value} />
  ),
  expirationStatusBadge: (cell: ExpirationStatusBadgeCellModel) => (
    <TableCellExpirationStatusBadge value={cell.value} />
  ),
  licensePeriodBadge: (cell: LicensePeriodBadgeCellModel) => (
    <TableCellLicensePeriodBadge value={cell.value} />
  ),
};

function renderCell(cell: SharedTableCell) {
  if (cell.type === 'custom') {
    return cell.render();
  }

  const renderer = cellRenderers[cell.type] as (cell: BuiltInSharedTableCell) => ReactNode;

  return renderer(cell);
}

/**
 * 공용 테이블 본문 렌더러.
 *
 * @description
 * 기존 `common-table` 마크업을 유지하면서
 * column / row / cell 화면 모델만으로 thead + tbody를 렌더링한다.
 *
 * 아직 기존 페이지에 일괄 적용하지 않고,
 * 공용 테이블 계약을 완성하기 위한 shared 본체로 먼저 쌓아 둔다.
 */
export function TableBodyRenderer({
  tableAriaLabel,
  columns,
  rows,
  tableClassName = 'common-table',
  emptyMessage = '조회 내용이 없습니다.',
  colGroup,
  headerCellOverrides,
}: TableBodyRendererProps) {
  return (
    <div className="common-table-wrap">
      <table className={tableClassName} aria-label={tableAriaLabel}>
        {colGroup}
        <thead>
          <tr>
            {columns.map((column) => {
              const headerCellOverride = headerCellOverrides?.[column.key];

              return (
                <TableHeaderCell
                  key={column.key}
                  label={column.label}
                  required={column.required}
                  className={
                    [getAlignClassName(column.align), column.className].filter(Boolean).join(' ') ||
                    undefined
                  }
                  ariaLabel={column.ariaLabel}
                >
                  {headerCellOverride ? renderCell(headerCellOverride) : undefined}
                </TableHeaderCell>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <SelectableTableRow
                key={row.id}
                selected={row.selected}
                selectOn={row.selectOn}
                onSelect={row.onSelect}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.tdClassName}>{renderCell(row.cells[column.key])}</td>
                ))}
              </SelectableTableRow>
            ))
          ) : (
            <EmptyTableRow colSpan={Math.max(columns.length, 1)} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  );
}
