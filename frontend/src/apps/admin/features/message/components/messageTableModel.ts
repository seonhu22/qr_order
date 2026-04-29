import type {
  SharedTableColumn,
  SharedTableRow,
} from '@/shared/components/table';
import type { MessageRow, MessageRowErrors } from '../types';

type CreateMessageTableModelParams = {
  rows: MessageRow[];
  selectedRowId: string;
  rowErrors: MessageRowErrors;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, key: 'code' | 'name' | 'content', value: string) => void;
};

export function createMessageTableColumns(): SharedTableColumn[] {
  return [
    { key: 'code', label: '메시지 코드', required: true },
    { key: 'name', label: '메시지 명', required: true },
    { key: 'content', label: '메시지 내용', required: true },
  ];
}

export function createMessageTableRows({
  rows,
  selectedRowId,
  rowErrors,
  onSelectRow,
  onChangeRowField,
}: CreateMessageTableModelParams): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    selected: selectedRowId === row.id,
    selectOn: 'mouseDown',
    onSelect: () => onSelectRow(row.id),
    cells: {
      code: {
        type: 'input',
        inputId: `${row.id}-message-code`,
        className: row.isNew
          ? 'common-table__input'
          : 'common-table__input common-table__input--readonly',
        controlState: row.isNew ? (rowErrors[row.id]?.code ? 'error' : '') : 'readonly',
        readOnly: !row.isNew,
        value: row.code,
        placeholder: '코드',
        ariaLabel: `${row.id} 메시지 코드`,
        onChange: (value) => onChangeRowField(row.id, 'code', value),
      },
      name: {
        type: 'input',
        inputId: `${row.id}-message-name`,
        className: 'common-table__input',
        controlState: rowErrors[row.id]?.name ? 'error' : '',
        value: row.name,
        placeholder: '메시지명',
        ariaLabel: `${row.id} 메시지 명`,
        onChange: (value) => onChangeRowField(row.id, 'name', value),
      },
      content: {
        type: 'input',
        inputId: `${row.id}-message-content`,
        className: 'common-table__input',
        controlState: rowErrors[row.id]?.content ? 'error' : '',
        value: row.content,
        placeholder: '내용',
        ariaLabel: `${row.id} 메시지 내용`,
        onChange: (value) => onChangeRowField(row.id, 'content', value),
      },
    },
  }));
}
