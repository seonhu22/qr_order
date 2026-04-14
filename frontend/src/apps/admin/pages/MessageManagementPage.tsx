import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import { MessageFilters } from '@/apps/admin/features/message/components/MessageFilters';
import { MessageTable } from '@/apps/admin/features/message/components/MessageTable';
import { useMessagePage } from '@/apps/admin/features/message/hooks/useMessagePage';
import { ConfirmModal, SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';

/**
 * 메시지 관리 페이지 컨테이너.
 *
 * @description
 * - 화면 레이아웃을 조립하는 역할만 담당한다.
 * - 실제 데이터와 이벤트 흐름은 `useMessagePage` 훅에 위임한다.
 */
export function MessageManagementPage() {
  const { data, status, actions, uiProps } = useMessagePage();

  return (
    <>
      <AdminMainLayout
        adminMainTitle="메시지 관리"
        depth1="시스템"
        depth2="시스템 관리"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <MessageFilters
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        {/* 테이블 본문은 feature 컴포넌트로 분리해 page는 조립만 담당한다. */}
        <MessageTable
          rows={data.rows}
          selectedRowId={uiProps.selectedRowId}
          isLoading={status.isLoading}
          isError={status.isError}
          isSaving={status.isSaving}
          onSelectRow={actions.handleSelectRow}
          onChangeRowField={actions.handleChangeRowField}
          onAddRow={actions.handleAddRow}
          onDeleteRow={actions.handleDeleteRow}
          onSave={actions.handleSave}
        />
      </AdminMainLayout>

      {/* dirty 상태에서 조회/초기화 시 먼저 확인받는다. */}
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
        description="저장하시겠습니까?"
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
        onClose={actions.closeSimpleModal}
      />
    </>
  );
}
