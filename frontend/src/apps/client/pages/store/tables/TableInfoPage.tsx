import './TableInfoPage.css';
import { TableInfoTable } from '@/apps/client/features/table-info/components/TableInfoTable';
import { useTableInfoPageState } from '@/apps/client/features/table-info/hooks/useTableInfoPageState';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { SimpleDefaultModal } from '@/shared/components/modal';

export function TableInfoPage() {
  const { data, status, uiProps, actions } = useTableInfoPageState();

  return (
    <section className="table-info-page" aria-label="테이블 관리">
      <SearchFilterCard
        ariaLabel="테이블 검색"
        inputId="table-info-search-keyword"
        inputAriaLabel="테이블 검색어"
        placeholder="테이블 번호, 테이블 이름으로 검색해주세요"
        draftKeyword={uiProps.draftKeyword}
        onKeywordChange={actions.handleKeywordChange}
        onSearch={actions.handleSearch}
        onReset={actions.handleReset}
      />

      <TableInfoTable
        rows={data.rows}
        selectedRowId={uiProps.selectedRowId}
        rowErrors={uiProps.rowErrors}
        isLoading={status.isLoading}
        isError={status.isError}
        isSaving={status.isSaving}
        onSelectRow={actions.handleSelectRow}
        onChangeRowField={actions.handleChangeRowField}
        onAddRow={actions.handleAddRow}
        onDeleteRow={actions.handleDeleteRow}
        onSave={actions.handleSave}
      />

      <SimpleDefaultModal
        open={uiProps.noticeMessage.length > 0}
        title="알림"
        description={uiProps.noticeMessage}
        onClose={actions.closeNotice}
      />
    </section>
  );
}
