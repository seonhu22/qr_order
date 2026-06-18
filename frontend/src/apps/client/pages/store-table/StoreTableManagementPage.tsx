import './StoreTableManagementPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { ConfirmModal, SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { StoreTableManagementTable } from '@/apps/client/features/store-table/components/StoreTableManagementTable';
import { useStoreTablePage } from '@/apps/client/features/store-table/hooks/useStoreTablePage';

export function StoreTableManagementPage() {
  const { data, status, actions, uiProps } = useStoreTablePage();

  return (
    <>
      <section className="store-table-management-page" aria-label="테이블 관리">
        <SearchFilterCard
          ariaLabel="테이블 검색"
          inputId="store-table-search-keyword"
          inputAriaLabel="테이블 검색어"
          placeholder="테이블 번호, 테이블 이름으로 검색"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <StoreTableManagementTable
          rows={data.rows}
          selectedRowId={uiProps.selectedRowId}
          rowErrors={data.rowErrors}
          isLoading={status.isLoading}
          isError={status.isError}
          isSaving={status.isSaving}
          onSelectRow={actions.handleSelectRow}
          onChangeRowField={actions.handleChangeRowField}
          onAddRow={actions.handleAddRow}
          onDeleteRow={actions.handleDeleteRow}
          onSave={actions.handleSave}
        />
      </section>

      <ConfirmModal
        open={uiProps.flowState.pendingFilterAction !== null}
        tone="info"
        title={uiProps.flowState.pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
        description="저장되지 않은 내용이 있습니다."
        onClose={actions.cancelFilterAction}
        primaryAction={{ onClick: actions.confirmFilterAction }}
        secondaryAction={{ onClick: actions.cancelFilterAction }}
      />

      <SaveConfirmModal
        open={uiProps.flowState.isSaveConfirmOpen}
        title="저장하시겠습니까?"
        description="입력하신 내용을 저장합니다."
        primaryAction={{
          label: '확인',
          loading: status.isSaving,
          onClick: actions.confirmSave,
        }}
        secondaryAction={{
          disabled: status.isSaving,
          onClick: actions.closeSaveConfirm,
        }}
        onClose={actions.closeSaveConfirm}
      />

      <SimpleDefaultModal
        open={!!uiProps.flowState.simpleModalState}
        description={uiProps.flowState.simpleModalState?.description}
        helperText={uiProps.flowState.simpleModalState?.helperText}
        primaryAction={
          uiProps.flowState.simpleModalState?.onConfirm
            ? { onClick: actions.confirmSimpleModal }
            : undefined
        }
        onClose={actions.closeSimpleModal}
      />
    </>
  );
}
