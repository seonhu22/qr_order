import { EditableMasterTable } from '@/shared/components/table/EditableMasterTable';
import type { RuleMasterRow } from '../types';

type RuleMasterTableProps = {
  rows: RuleMasterRow[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: RuleMasterRow) => void;
  onDelete: () => void;
};

export function RuleMasterTable(props: RuleMasterTableProps) {
  return (
    <EditableMasterTable
      title="규칙 목록"
      ariaLabel="규칙 목록"
      tableAriaLabel="규칙 목록 테이블"
      labels={{
        code: '규칙코드',
        name: '규칙명',
      }}
      statusText={{
        loading: '규칙 목록을 불러오는 중입니다.',
        errorDescription: '다시 한번 시도해주세요.',
        emptyMessage: '조회 결과가 없습니다.',
      }}
      rows={props.rows}
      isLoading={props.isLoading}
      isError={props.isError}
      selection={{
        selectedId: props.selectedMasterId,
        checkedIds: props.checkedMasterIds,
        isAllChecked: props.isAllChecked,
      }}
      actions={{
        onSelectRow: props.onSelectRow,
        onToggleRow: props.onToggleRow,
        onToggleAllRows: props.onToggleAllRows,
        onCreate: props.onCreate,
        onEdit: props.onEdit,
        onDelete: props.onDelete,
      }}
    />
  );
}
