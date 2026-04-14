import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/CommonCodePage.css';
import { RuleDetailTable } from '@/apps/admin/features/rule-management/components/RuleDetailTable';
import { RuleMasterTable } from '@/apps/admin/features/rule-management/components/RuleMasterTable';
import { useRuleManagementPage } from '@/apps/admin/features/rule-management/hooks/useRuleManagementPage';

/**
 * 규칙 관리 페이지 컨테이너.
 *
 * @description
 * 검색 영역 없이 마스터/상세 테이블만 조립한다.
 * 실제 상태 조합과 저장 흐름은 feature 훅과 shared 훅에 위임한다.
 */
export function RuleManagementPage() {
  const { data, status, actions, uiProps } = useRuleManagementPage();

  return (
    <AdminMainLayout adminMainTitle="규칙 관리" depth1="시스템" depth2="시스템 관리">
      <RuleMasterTable
        rows={data.masterRows}
        isLoading={status.isLoadingMasters}
        isError={status.isErrorMasters}
        selectedMasterId={uiProps.selectedMasterId}
        checkedMasterIds={uiProps.checkedMasterIds}
        isAllChecked={uiProps.isAllMastersChecked}
        onSelectRow={actions.handleSelectMaster}
        onToggleRow={actions.handleToggleMaster}
        onToggleAllRows={actions.handleToggleAllMasters}
        onSaveMaster={actions.handleSaveMaster}
        onDeleteMasters={actions.handleDeleteMasters}
      />

      <RuleDetailTable
        selectedMaster={data.selectedMaster}
        isLoading={status.isLoadingDetails}
        isSaving={status.isSavingDetails}
        columns={data.detailColumns}
        rows={data.detailRows}
        onChangeValue={actions.handleChangeDetailValue}
        onAddRow={actions.handleAddDetailRow}
        onDeleteRow={actions.handleDeleteDetailRow}
        onMoveUp={actions.handleMoveDetailRowUp}
        onMoveDown={actions.handleMoveDetailRowDown}
        onSaveRows={actions.handleSaveDetailRows}
      />
    </AdminMainLayout>
  );
}
