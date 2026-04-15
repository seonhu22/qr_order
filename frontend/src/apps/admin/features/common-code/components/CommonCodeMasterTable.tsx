import { CodeMasterTable } from '@/shared/components/table/CodeMasterTable';
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
    <CodeMasterTable
      {...props}
      title="공통코드 마스터"
      ariaLabel="공통코드 마스터"
      tableAriaLabel="공통코드 마스터 테이블"
      codeLabel="공통코드"
      nameLabel="공통코드명"
      loadingTitle="공통코드 목록을 불러오는 중입니다."
      errorTitle="불러오는데 실패했습니다."
    />
  );
}
