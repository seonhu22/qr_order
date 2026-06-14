import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TableInfoTable } from './TableInfoTable';
import type { TableInfoRow, TableInfoRowErrors } from '../types';

const rows: TableInfoRow[] = [
  {
    id: 'table-1',
    sysId: 'sys-1',
    tableNum: '1',
    tableName: '테이블 1번',
    tableQty: '4',
    useYn: 'Y',
    isNew: false,
  },
  {
    id: 'table-2',
    sysId: 'sys-2',
    tableNum: '2',
    tableName: '테이블 2번',
    tableQty: '4',
    useYn: 'N',
    isNew: false,
  },
];

const rowErrors: TableInfoRowErrors = {
  'table-1': { tableNum: false, tableName: false, tableQty: false, useYn: false },
  'table-2': { tableNum: false, tableName: false, tableQty: false, useYn: false },
};

const createProps = () => ({
  rows,
  selectedRowId: 'table-2',
  rowErrors,
  isLoading: false,
  isError: false,
  isSaving: false,
  onSelectRow: vi.fn(),
  onChangeRowField: vi.fn(),
  onAddRow: vi.fn(),
  onDeleteRow: vi.fn(),
  onSave: vi.fn(),
});

describe('TableInfoTable', () => {
  it('renders table information rows with inline controls', () => {
    render(<TableInfoTable {...createProps()} />);

    expect(screen.getByText('테이블 목록')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('테이블 1번')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('4')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: '미사용' })).toHaveTextContent('미사용');
  });

  it('calls row action handlers', () => {
    const props = createProps();
    const { container } = render(<TableInfoTable {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '+ 행추가' }));
    fireEvent.click(screen.getByRole('button', { name: '- 행삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.mouseDown(container.querySelectorAll('tbody tr')[0]);

    expect(props.onAddRow).toHaveBeenCalledTimes(1);
    expect(props.onDeleteRow).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onSelectRow).toHaveBeenCalledWith('table-1');
  });

  it('updates editable row fields', () => {
    const props = createProps();

    render(<TableInfoTable {...props} />);

    fireEvent.change(screen.getByDisplayValue('테이블 1번'), {
      target: { value: '창가 테이블' },
    });

    expect(props.onChangeRowField).toHaveBeenCalledWith('table-1', 'tableName', '창가 테이블');
  });

  it('applies error state to invalid required fields', () => {
    const props = createProps();

    render(
      <TableInfoTable
        {...props}
        rowErrors={{
          ...rowErrors,
          'table-1': { tableNum: true, tableName: true, tableQty: true, useYn: true },
        }}
      />,
    );

    expect(screen.getByDisplayValue('1').closest('.input-control')).toHaveAttribute(
      'data-state',
      'error',
    );
    expect(screen.getByRole('combobox', { name: '사용' }).closest('.select-control')).toHaveAttribute(
      'data-state',
      'error',
    );
  });
});
