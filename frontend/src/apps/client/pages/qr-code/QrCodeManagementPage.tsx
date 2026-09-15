import './QrCodeManagementPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { ConfirmModal, SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { QrCodeManagementTable } from '@/apps/client/features/qr-code/components/QrCodeManagementTable';
import { useQrCodePage } from '@/apps/client/features/qr-code/hooks/useQrCodePage';

export function QrCodeManagementPage() {
  const { data, status, actions, uiProps } = useQrCodePage();

  return (
    <>
      <section className="qr-code-management-page" aria-label="QR 코드 관리">
        <SearchFilterCard
          ariaLabel="QR 코드 검색"
          inputId="qr-code-search-keyword"
          inputAriaLabel="QR 코드 검색어"
          placeholder="테이블 번호, 비고로 검색"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <QrCodeManagementTable
          rows={data.rows}
          selectedRowId={uiProps.selectedRowId}
          checkedRowIds={uiProps.checkedRowIds}
          rowErrors={data.rowErrors}
          tableNumOptions={data.tableNumOptions}
          isLoading={status.isLoading}
          isError={status.isError}
          isSaving={status.isSaving}
          onSelectRow={actions.handleSelectRow}
          onToggleRow={actions.handleToggleRow}
          onToggleAll={actions.handleToggleAll}
          onChangeRowField={actions.handleChangeRowField}
          onPrintRow={actions.handlePrintRow}
          onBulkPrint={actions.handleBulkPrint}
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

      <ConfirmModal
        open={uiProps.printConfirm.open}
        tone="info"
        title="QR 코드를 출력하겠습니까?"
        description={
          uiProps.printConfirm.count > 1
            ? `총 ${uiProps.printConfirm.count}건이 출력됩니다.`
            : undefined
        }
        onClose={actions.cancelPrint}
        primaryAction={{ onClick: actions.confirmPrint }}
        secondaryAction={{ onClick: actions.cancelPrint }}
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
