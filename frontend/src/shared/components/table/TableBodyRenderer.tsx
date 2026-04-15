import type { ReactNode } from 'react';
import {
  EmptyTableRow,
  RequiredHeaderLabel,
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
  SharedTableCell,
  SharedTableColumn,
  SharedTableRow,
  TableColumnAlign,
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

function renderCell(cell: SharedTableCell) {
  switch (cell.type) {
    case 'text':
      return (
        <span className={cell.className} title={cell.title}>
          {cell.value}
        </span>
      );

    case 'input':
      return (
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
      );

    case 'checkbox':
      return (
        <TableCellCheckbox
          checked={cell.checked}
          ariaLabel={cell.ariaLabel}
          className={cell.className}
          onChange={cell.onChange}
        />
      );

    case 'select':
      return (
        <TableCellSelect
          value={cell.value}
          options={cell.options}
          placeholder={cell.placeholder}
          className={cell.className}
          isError={cell.isError}
          searchable={cell.searchable}
          onChange={cell.onChange}
        />
      );

    case 'editButton':
      return <TableCellEditButton ariaLabel={cell.ariaLabel} onClick={cell.onClick} />;

    case 'passwordResetButton':
      return <TableCellPasswordResetButton disabled={cell.disabled} onClick={cell.onClick} />;

    case 'useYnBadge':
      return <TableCellUseYnBadge value={cell.value} />;

    case 'changeTypeBadge':
      return <TableCellChangeTypeBadge value={cell.value} />;

    case 'expirationStatusBadge':
      return <TableCellExpirationStatusBadge value={cell.value} />;

    case 'licensePeriodBadge':
      return <TableCellLicensePeriodBadge value={cell.value} />;

    case 'custom':
      return cell.render();
  }
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
  emptyMessage = '검색 결과가 없습니다.',
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
                  <td key={column.key}>{renderCell(row.cells[column.key])}</td>
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
