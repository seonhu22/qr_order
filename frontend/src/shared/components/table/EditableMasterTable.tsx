import { MasterTableActions } from '@/shared/components/table/TableActionGroups';
import { TableBodyRenderer } from '@/shared/components/table/TableBodyRenderer';
import { TableCard } from '@/shared/components/table/TableCard';
import { TableCardContentState } from '@/shared/components/table/TableCardContentState';
import {
  createCodeMasterHeaderCellOverrides,
  createCodeMasterTableColumns,
  createCodeMasterTableRows,
} from '@/shared/components/table/codeMasterTableModel';
import type { EditableMasterRow } from '@/shared/components/table/editableTableTypes';

type EditableMasterTableLabels = {
  code: string;
  name: string;
};

type EditableMasterTableStatusText = {
  loading: string;
  errorTitle?: string;
  errorDescription?: string;
};

type EditableMasterTableSelectionState = {
  selectedId: string;
  checkedIds: string[];
  isAllChecked: boolean;
};

type EditableMasterTableActions<T extends EditableMasterRow> = {
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: T) => void;
  onDelete: () => void;
};

type EditableMasterTableProps<T extends EditableMasterRow> = {
  title: string;
  ariaLabel: string;
  tableAriaLabel: string;
  labels: EditableMasterTableLabels;
  statusText: EditableMasterTableStatusText;
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  selection: EditableMasterTableSelectionState;
  actions: EditableMasterTableActions<T>;
};

/**
 * 공통코드/규칙관리에서 재사용하는 공용 마스터 편집 테이블.
 *
 * @description
 * 코드/이름/사용여부/수정 컬럼과 상단 신규·삭제 액션을 고정 구조로 제공한다.
 * 선택 상태와 액션 핸들러는 묶음 props로 받아 도메인별 차이만 밖에서 주입한다.
 */
export function EditableMasterTable<T extends EditableMasterRow>({
  title,
  ariaLabel,
  tableAriaLabel,
  labels,
  statusText,
  rows,
  isLoading,
  isError,
  selection,
  actions,
}: EditableMasterTableProps<T>) {
  const columns = createCodeMasterTableColumns({
    title,
    codeLabel: labels.code,
    nameLabel: labels.name,
  });
  const tableRows = createCodeMasterTableRows({
    rows,
    title,
    selectedMasterId: selection.selectedId,
    checkedMasterIds: selection.checkedIds,
    onSelectRow: actions.onSelectRow,
    onToggleRow: actions.onToggleRow,
    onEdit: actions.onEdit,
  });
  const headerCellOverrides = createCodeMasterHeaderCellOverrides({
    title,
    isAllChecked: selection.isAllChecked,
    onToggleAllRows: actions.onToggleAllRows,
  });

  return (
    <TableCard
      title={title}
      ariaLabel={ariaLabel}
      actions={<MasterTableActions onCreate={actions.onCreate} onDelete={actions.onDelete} />}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle={statusText.loading}
        errorTitle={statusText.errorTitle}
        errorDescription={statusText.errorDescription}
      >
        <TableBodyRenderer
          tableAriaLabel={tableAriaLabel}
          columns={columns}
          rows={tableRows}
          colGroup={
            <colgroup>
              <col style={{ width: '3rem' }} />
              <col />
              <col />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '4rem' }} />
            </colgroup>
          }
          headerCellOverrides={headerCellOverrides}
        />
      </TableCardContentState>
    </TableCard>
  );
}
