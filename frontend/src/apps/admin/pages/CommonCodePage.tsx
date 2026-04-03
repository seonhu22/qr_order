import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/CommonCodePage.css';
import { useCommonCodePageState } from '@/apps/admin/features/common-code/hooks/useCommonCodePageState';
import { CommonCodeMasterTable } from '@/apps/admin/features/common-code/components/CommonCodeMasterTable';
import { CommonCodeDetailTable } from '@/apps/admin/features/common-code/components/CommonCodeDetailTable';

export const CommonCodePage = () => {
  const {
    masterRows,
    selectedMaster,
    selectedMasterId,
    checkedMasterIds,
    detailRows,
    isAllMastersChecked,
    isAllDetailsChecked,
    checkedDetailIds,
    selectMaster,
    toggleMasterChecked,
    toggleAllMasters,
    toggleDetailChecked,
    toggleAllDetails,
    changeDetailField,
    changeDetailUseYn,
    addDetailRow,
    removeCheckedDetailRows,
  } = useCommonCodePageState();

  return (
    <AdminMainLayout adminMainTitle="공통코드 관리" depth1="시스템" depth2="시스템 관리">
      <CommonCodeMasterTable
        rows={masterRows}
        selectedMasterId={selectedMasterId}
        checkedMasterIds={checkedMasterIds}
        isAllChecked={isAllMastersChecked}
        onSelectRow={selectMaster}
        onToggleRow={toggleMasterChecked}
        onToggleAllRows={toggleAllMasters}
      />

      {/* 마스터에서 선택사항이 없으면 detail 테이블 대신 feedback을 표시 */}
      <CommonCodeDetailTable
        selectedMaster={selectedMaster}
        rows={detailRows}
        isAllChecked={isAllDetailsChecked}
        checkedCount={checkedDetailIds.length}
        onToggleRow={toggleDetailChecked}
        onToggleAllRows={toggleAllDetails}
        onFieldChange={changeDetailField}
        onUseYnChange={changeDetailUseYn}
        onAddRow={addDetailRow}
        onDeleteRows={removeCheckedDetailRows}
      />
    </AdminMainLayout>
  );
};
