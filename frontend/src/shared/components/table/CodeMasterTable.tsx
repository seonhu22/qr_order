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

/**
 * 이 컴포넌트는 공통코드/규칙관리 같은 마스터 CRUD 화면에서 사용하는 테이블을 공통화한 것이다.
 *
 * @description
 * 코드/이름/사용여부/수정 컬럼과 상단 신규·삭제 액션을 고정 구조로 제공하고,
 * 선택 상태/체크 상태/수정 이벤트는 바깥에서 주입받아 도메인별로 재사용한다.
 */

type CodeMasterTableProps<T extends EditableMasterRow> = {
  title: string;
  ariaLabel: string;
  tableAriaLabel: string;
  codeLabel: string;
  nameLabel: string;
  loadingTitle: string;
  errorTitle?: string;
  errorDescription?: string;
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onCreate: () => void;
  onEdit: (row: T) => void;
  onDelete: () => void;
};

/**
 * 마스터 CRUD 목록 테이블을 공통 형태로 렌더링하는 조립 컴포넌트.
 *
 * @description
 * 코드/이름/사용여부/수정 컬럼과 상단 신규·삭제 액션을 고정 구조로 제공하고,
 * 선택 상태/체크 상태/수정 이벤트는 바깥에서 주입받아 도메인별로 재사용한다.
 */
export function CodeMasterTable<T extends EditableMasterRow>({
  title,
  ariaLabel,
  tableAriaLabel,
  codeLabel,
  nameLabel,
  loadingTitle,
  errorTitle,
  errorDescription = '다시 한번 시도해주세요.',
  rows,
  isLoading,
  isError,
  selectedMasterId,
  checkedMasterIds,
  isAllChecked,
  onSelectRow,
  onToggleRow,
  onToggleAllRows,
  onCreate,
  onEdit,
  onDelete,
}: CodeMasterTableProps<T>) {
  const columns = createCodeMasterTableColumns({
    title,
    codeLabel,
    nameLabel,
  });
  const tableRows = createCodeMasterTableRows({
    rows,
    title,
    selectedMasterId,
    checkedMasterIds,
    onSelectRow,
    onToggleRow,
    onEdit,
  });
  const headerCellOverrides = createCodeMasterHeaderCellOverrides({
    title,
    isAllChecked,
    onToggleAllRows,
  });

  return (
    <TableCard
      title={title}
      ariaLabel={ariaLabel}
      actions={<MasterTableActions onCreate={onCreate} onDelete={onDelete} />}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle={loadingTitle}
        errorTitle={errorTitle}
        errorDescription={errorDescription}
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
