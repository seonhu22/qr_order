/**
 * @fileoverview 매장 > 메뉴 > 메뉴 정보 관리 > 직원호출 관리 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 상태 계산은 `useStaffCallManagementPage` feature hook에서 처리한다.
 */

import './StaffCallManagementPage.css';
import { StaffCallManagementTable } from '@/apps/client/features/staff-call-management/components/StaffCallManagementTable';
import { useStaffCallManagementPage } from '@/apps/client/features/staff-call-management/hooks/useStaffCallManagementPage';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { ConfirmModal, SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';

export function StaffCallManagementPage() {
  const { master, data, status, uiProps, actions } = useStaffCallManagementPage();

  return (
    <>
      <section className="staff-call-management-page" aria-label="직원호출 관리">
        <SearchFilterCard
          ariaLabel="직원호출 항목 검색"
          inputId="staff-call-search-keyword"
          inputAriaLabel="호출명 검색어"
          placeholder="호출명을 입력해주세요"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <StaffCallManagementTable
          masterId={master.id}
          isLoading={status.isLoading}
          isSaving={status.isSaving}
          rows={data.rows}
          emptyRowsText={data.emptyRowsText}
          rowErrors={uiProps.rowErrors}
          onChangeValue={actions.changeValue}
          onClearRowError={actions.clearRowError}
          onAddRow={actions.addRow}
          onDeleteRow={actions.removeRow}
          onMoveUp={actions.moveRowUp}
          onMoveDown={actions.moveRowDown}
          onSave={actions.requestSave}
        />
      </section>

      <SaveConfirmModal
        open={uiProps.saveConfirm.open}
        title="저장하시겠습니까?"
        description="입력하신 내용을 저장합니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.saveConfirm.isLoading,
          onClick: actions.confirmSave,
        }}
        secondaryAction={{
          disabled: uiProps.saveConfirm.isLoading,
          onClick: actions.closeSaveConfirm,
        }}
        onClose={actions.closeSaveConfirm}
      />

      <SimpleDefaultModal
        open={uiProps.notice.open}
        title={uiProps.notice.title}
        description={uiProps.notice.description}
        primaryAction={
          uiProps.notice.hasConfirmAction
            ? { label: '확인', onClick: actions.confirmNotice }
            : undefined
        }
        onClose={actions.closeNotice}
      />

      <ConfirmModal
        open={uiProps.pendingFilterAction !== null}
        tone="info"
        title={uiProps.pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
        description="저장되지 않은 내용이 있습니다."
        onClose={actions.cancelFilterAction}
        primaryAction={{ onClick: actions.confirmFilterAction }}
        secondaryAction={{ onClick: actions.cancelFilterAction }}
      />
    </>
  );
}
