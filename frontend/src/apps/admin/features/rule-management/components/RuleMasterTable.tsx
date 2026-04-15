import { CodeMasterTable } from '@/shared/components/table/CodeMasterTable';
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
    <CodeMasterTable
      {...props}
      title="규칙 목록"
      ariaLabel="규칙 목록"
      tableAriaLabel="규칙 목록 테이블"
      codeLabel="규칙코드"
      nameLabel="규칙명"
      loadingTitle="규칙 목록을 불러오는 중입니다."
      errorDescription="다시 한번 시도해주세요."
    />
  );
}
