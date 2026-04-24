import { EditableMasterTable } from '@/shared/components/table/EditableMasterTable';
import type { MasterCode } from '../types';

type CommonCodeMasterTableProps = {
  rows: MasterCode[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: MasterCode) => void;
  onDelete: () => void;
};

export function CommonCodeMasterTable(props: CommonCodeMasterTableProps) {
  return (
    <EditableMasterTable
      title="공통코드 마스터"
      ariaLabel="공통코드 마스터"
      tableAriaLabel="공통코드 마스터 테이블"
      labels={{
        code: '공통코드',
        name: '공통코드명',
      }}
      statusText={{
        loading: '공통코드 목록을 불러오는 중입니다.',
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
