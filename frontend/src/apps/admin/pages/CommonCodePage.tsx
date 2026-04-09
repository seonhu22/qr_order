/**
 * @fileoverview 공통코드 관리 페이지 컨테이너
 *
 * @description
 * - 화면 레이아웃과 feature 컴포넌트를 조립하는 역할만 맡는다.
 * - 실제 상태 조합과 서버 연동은 useCommonCodePageState로 위임한다.
 */

import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/CommonCodePage.css';
import { useCommonCodePageState } from '@/apps/admin/features/common-code/hooks/useCommonCodePageState';
import { CommonCodeFilters } from '@/apps/admin/features/common-code/components/CommonCodeFilters';
import { CommonCodeMasterTable } from '@/apps/admin/features/common-code/components/CommonCodeMasterTable';
import { CommonCodeDetailTable } from '@/apps/admin/features/common-code/components/CommonCodeDetailTable';

/**
 * 공통코드 관리 페이지를 렌더링한다.
 */
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
    canMoveDetailRowsUp,
    canMoveDetailRowsDown,
    draftMasterKeyword,
    onMasterKeywordChange,
    onMasterSearch,
    onMasterReset,
    selectMaster,
    toggleMasterChecked,
    toggleAllMasters,
    toggleDetailChecked,
    toggleAllDetails,
    changeDetailField,
    changeDetailUseYn,
    addDetailRow,
    removeCheckedDetailRows,
    moveCheckedDetailRowsUp,
    moveCheckedDetailRowsDown,
    isSavingMaster,
    isDeletingMasters,
    isSavingDetails,
    saveMaster,
    deleteCheckedMasters,
    saveDetailRows,
  } = useCommonCodePageState();

  return (
    <AdminMainLayout
      adminMainTitle="공통코드 관리"
      depth1="시스템"
      depth2="시스템 관리"
      className="admin-main-layout-page--fixed"
      filterSlot={
        <CommonCodeFilters
          draftKeyword={draftMasterKeyword}
          onKeywordChange={onMasterKeywordChange}
          onSearch={onMasterSearch}
          onReset={onMasterReset}
        />
      }
    >
      <CommonCodeMasterTable
        rows={masterRows}
        selectedMasterId={selectedMasterId}
        checkedMasterIds={checkedMasterIds}
        isAllChecked={isAllMastersChecked}
        onSelectRow={selectMaster}
        onToggleRow={toggleMasterChecked}
        onToggleAllRows={toggleAllMasters}
        isSaving={isSavingMaster}
        isDeleting={isDeletingMasters}
        onSaveMaster={saveMaster}
        onDeleteMasters={deleteCheckedMasters}
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
        canMoveUp={canMoveDetailRowsUp}
        canMoveDown={canMoveDetailRowsDown}
        onMoveUp={moveCheckedDetailRowsUp}
        onMoveDown={moveCheckedDetailRowsDown}
        isSaving={isSavingDetails}
        onSaveRows={saveDetailRows}
      />
    </AdminMainLayout>
  );
};
