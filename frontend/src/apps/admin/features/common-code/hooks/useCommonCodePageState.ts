/**
 * @fileoverview 공통코드 페이지 상태 조합 훅
 *
 * @description
 * - 서버 조회(Query)와 화면 편집 상태(draft)를 한 곳에서 조합한다.
 * - 페이지/테이블 컴포넌트는 이 훅이 제공하는 값과 액션만 사용한다.
 * - 마스터/상세 선택, 체크 상태, 상세 draft 편집, 저장/삭제, 순번 이동까지 담당한다.
 */

import { useEffect, useMemo, useState } from 'react';
import { useCodeMasterModalFlow } from '@/shared/hooks/useCodeMasterModalFlow';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { DetailCode, MasterCode } from '../types';
import {
  buildCommonDetailRequest,
  hasCommonDetailChanges,
  mapToCommonDetailModel,
  mapToCommonMasterModel,
  useCommonCodeDetailsQuery,
  useCommonCodeMastersQuery,
  useDeleteCommonMastersMutation,
  useSaveCommonDetailsMutation,
  useSaveCommonMasterMutation,
} from '../api/commonCodeApi';

function cloneRows(rows: DetailCode[]) {
  return rows.map((row) => ({ ...row }));
}

/**
 * 공통코드 화면에서 사용하는 모든 상태와 액션을 조합한다.
 *
 * @description
 * - masterRows, detailRows는 서버 응답을 화면용 모델로 바꾼 결과다.
 * - detailRowsByMaster는 사용자가 편집 중인 로컬 draft다.
 * - initialDetailRowsByMaster는 최초 조회 시점 스냅샷으로, 상세 저장 diff 계산에 사용한다.
 */
export function useCommonCodePageState() {
  const queryClient = useQueryClient();
  const orderedRowEditor = useOrderedRowEditor<DetailCode>();
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [detailRowsByMaster, setDetailRowsByMaster] = useState<Record<string, DetailCode[]>>({});
  const [initialDetailRowsByMaster, setInitialDetailRowsByMaster] = useState<
    Record<string, DetailCode[]>
  >({});

  /* 검색 키워드: draft는 입력 중인 값, masterKeyword는 조회에 실제 사용되는 값 */
  const [draftMasterKeyword, setDraftMasterKeyword] = useState('');
  const [masterKeyword, setMasterKeyword] = useState('');

  /* 조회·초기화 dirty guard: useFilterDirtyCheck로 관리 */

  const mastersQuery = useCommonCodeMastersQuery(masterKeyword);
  const saveMasterMutation = useSaveCommonMasterMutation();
  const deleteMastersMutation = useDeleteCommonMastersMutation();
  const detailQuery = useCommonCodeDetailsQuery(selectedMasterId);
  const saveDetailsMutation = useSaveCommonDetailsMutation();

  const masterRows = useMemo(
    () => (mastersQuery.data ?? []).map(mapToCommonMasterModel),
    [mastersQuery.data],
  );
  const selectedMaster = masterRows.find((row) => row.id === selectedMasterId) ?? null;
  const detailRows = selectedMaster ? (detailRowsByMaster[selectedMaster.id] ?? []) : [];
  const isAllMastersChecked =
    masterRows.length > 0 && checkedMasterIds.length === masterRows.length;

  /** 현재 선택된 마스터의 상세에 저장되지 않은 변경이 있으면 true */
  const isDetailDirty = useMemo(() => {
    if (!selectedMaster) return false;
    const currentRows = detailRowsByMaster[selectedMaster.id] ?? [];
    const originalRows = initialDetailRowsByMaster[selectedMaster.id] ?? [];
    const request = buildCommonDetailRequest(selectedMaster.id, currentRows, originalRows);
    return hasCommonDetailChanges(request);
  }, [selectedMaster, detailRowsByMaster, initialDetailRowsByMaster]);

  useEffect(() => {
    if (selectedMasterId && !masterRows.some((row) => row.id === selectedMasterId)) {
      setSelectedMasterId('');
    }
  }, [masterRows, selectedMasterId]);

  useEffect(() => {
    setCheckedMasterIds((prev) => prev.filter((id) => masterRows.some((row) => row.id === id)));
  }, [masterRows]);

  useEffect(() => {
    if (!selectedMasterId || !detailQuery.data) {
      return;
    }

    const mappedRows = detailQuery.data.map(mapToCommonDetailModel);

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
    setInitialDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
  }, [selectedMasterId, detailQuery.data]);

  /**
   * 현재 선택된 마스터의 상세 draft만 안전하게 갱신한다.
   */
  const updateSelectedDetailRows = (updater: (rows: DetailCode[]) => DetailCode[]) => {
    if (!selectedMaster) {
      return;
    }

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: updater(prev[selectedMaster.id] ?? []),
    }));
  };

  const handleMasterKeywordChange = (value: string) => {
    setDraftMasterKeyword(value);
  };

  const handleMasterSearch = () => {
    setMasterKeyword(draftMasterKeyword);
  };

  const handleMasterReset = () => {
    setDraftMasterKeyword('');
    setMasterKeyword('');
    setSelectedMasterId('');
    setCheckedMasterIds([]);
    setDetailRowsByMaster({});
    setInitialDetailRowsByMaster({});
  };

  const {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty: isDetailDirty,
    onSearch: handleMasterSearch,
    onReset: handleMasterReset,
  });

  const selectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  const toggleMasterChecked = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  const toggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : masterRows.map((row) => row.id));
  };

  const changeDetailField = (detailId: string, key: 'code' | 'name', value: string) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => (row.id === detailId ? { ...row, [key]: value } : row)),
    );
  };

  const changeDetailUseYn = (detailId: string, checked: boolean) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => (row.id === detailId ? { ...row, useYn: checked } : row)),
    );
  };

  const addDetailRow = () => {
    if (!selectedMaster) {
      return;
    }

    const nextRow: DetailCode = {
      id: `new-${selectedMaster.id}-${Date.now()}`,
      linkSysId: selectedMaster.id,
      code: '',
      name: '',
      useYn: true,
      ordNo: detailRows.length + 1,
      isNew: true,
    };

    updateSelectedDetailRows((rows) => orderedRowEditor.appendRow(rows, nextRow));
  };

  const removeCheckedDetailRows = (selectedId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.removeRow(rows, selectedId));
  };

  const moveCheckedDetailRowsUp = (selectedId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.moveRowUp(rows, selectedId));
  };

  const moveCheckedDetailRowsDown = (selectedId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.moveRowDown(rows, selectedId));
  };

  /**
   * 마스터 저장 후 목록 query를 다시 조회한다.
   *
   * @description
   * - 낙관적 업데이트 대신 invalidate 후 재조회 방식을 사용한다.
   * - 업무 화면에서 서버 정합성을 우선하기 위한 선택이다.
   */
  const saveMaster = async (master: { id: string; sysId?: string; code: string; name: string; useYn: 'Y' | 'N' }, isCreateMode: boolean) => {
    await saveMasterMutation.mutateAsync(master, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masters() });
  };

  /**
   * 체크된 마스터를 삭제하고 목록/선택 상태를 정리한다.
   */
  const deleteCheckedMasters = async () => {
    const targets = masterRows.filter((row) => checkedMasterIds.includes(row.id));

    if (!targets.length) {
      return 0;
    }

    await deleteMastersMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masters() });

    if (targets.some((row) => row.id === selectedMasterId)) {
      setSelectedMasterId('');
    }

    setCheckedMasterIds([]);

    return targets.length;
  };

  /**
   * 상세 draft를 저장 요청으로 변환해 서버에 전송한다.
   *
   * @returns {Promise<boolean>} 실제 변경이 있어 저장을 수행했으면 true, 아니면 false
   */
  const saveDetailRows = async () => {
    if (!selectedMaster) {
      return false;
    }

    const currentRows = detailRowsByMaster[selectedMaster.id] ?? [];
    const originalRows = initialDetailRowsByMaster[selectedMaster.id] ?? [];
    const request = buildCommonDetailRequest(selectedMaster.id, currentRows, originalRows);

    if (!hasCommonDetailChanges(request)) {
      return false;
    }

    await saveDetailsMutation.mutateAsync(request);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.details(selectedMaster.id) });

    return true;
  };

  const detailFlow = useDetailTableSaveFlow({
    validateRows: () =>
      Object.fromEntries(
        detailRows.map((row) => [
          row.id,
          {
            code: row.isNew ? !row.code.trim() : false,
            name: !row.name.trim(),
          },
        ]),
      ),
    onSaveRows: saveDetailRows,
    applyServerValidationErrors: (message) => {
      const nextErrors: Record<string, { code?: boolean; name?: boolean }> = {};
      const normalized = message.toLowerCase();

      if (normalized.includes('common_cd') || message.includes('공통코드')) {
        detailRows.forEach((row) => {
          nextErrors[row.id] = {
            ...nextErrors[row.id],
            code: true,
          };
        });
      }

      if (normalized.includes('common_nm') || message.includes('공통코드명')) {
        detailRows.forEach((row) => {
          nextErrors[row.id] = {
            ...nextErrors[row.id],
            name: true,
          };
        });
      }

      return nextErrors;
    },
  });

  const masterFlow = useCodeMasterModalFlow({
    checkedRowIds: checkedMasterIds,
    createEmptyRow: (): MasterCode => ({ id: '', code: '', name: '', useYn: 'Y' }),
    onSaveRow: saveMaster,
    onDeleteRows: deleteCheckedMasters,
  });

  const masterModalProps = {
    editor: {
      open: masterFlow.isEditorOpen,
      isDirty: masterFlow.isDirty,
      isCreateMode: masterFlow.isCreateMode,
      isCodeReadonly: masterFlow.isCodeReadonly,
      editingRow: masterFlow.editingRow,
      editorErrors: masterFlow.editorErrors,
    },
    saveConfirm: {
      open: masterFlow.isSaveConfirmOpen,
      isCreateMode: masterFlow.isCreateMode,
      isLoading: masterFlow.isConfirming,
    },
    deleteConfirm: {
      open: masterFlow.isDeleteConfirmOpen,
      isLoading: masterFlow.isConfirmingDelete,
      selectedDeleteCount: masterFlow.selectedDeleteCount,
    },
    dirtyWarning: {
      open: masterFlow.isDirtyWarningOpen,
    },
    notice: {
      open: !!masterFlow.noticeState,
      title: masterFlow.noticeState?.title ?? '알림',
      description: masterFlow.noticeState?.description,
      helperText: masterFlow.noticeState?.helperText,
    },
  };

  const detailModalProps = {
    saveConfirm: {
      open: detailFlow.isSaveConfirmOpen,
      isLoading: detailFlow.isConfirming,
    },
    notice: {
      open: !!detailFlow.notice,
      title: detailFlow.notice?.title ?? '안내',
      description: detailFlow.notice?.description,
    },
  };

  return {
    data: {
      masterRows,
      selectedMaster,
      detailRows,
    },
    status: {
      isLoadingMasters: mastersQuery.isLoading,
      isErrorMasters: mastersQuery.isError,
      isLoadingDetails: detailQuery.isLoading,
      isSavingDetails: saveDetailsMutation.isPending,
    },
    actions: {
      handleMasterKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      confirmFilterAction,
      cancelFilterAction,
      handleSelectMaster: selectMaster,
      handleToggleMaster: toggleMasterChecked,
      handleToggleAllMasters: toggleAllMasters,
      handleChangeDetailField: changeDetailField,
      handleChangeDetailUseYn: changeDetailUseYn,
      handleAddDetailRow: addDetailRow,
      handleDeleteDetailRow: removeCheckedDetailRows,
      handleMoveDetailRowUp: moveCheckedDetailRowsUp,
      handleMoveDetailRowDown: moveCheckedDetailRowsDown,
      openCreateMasterModal: masterFlow.openCreateModal,
      openEditMasterModal: masterFlow.openEditModal,
      closeMasterEditorModal: masterFlow.closeEditorModal,
      forceCloseMasterEditorModal: masterFlow.forceCloseEditorModal,
      changeMasterEditingField: masterFlow.changeEditingField,
      requestSaveMaster: masterFlow.requestSave,
      confirmSaveMaster: masterFlow.confirmSave,
      requestDeleteMasters: masterFlow.requestDelete,
      confirmDeleteMasters: masterFlow.confirmDelete,
      closeMasterSaveConfirm: masterFlow.closeSaveConfirm,
      closeMasterDeleteConfirm: masterFlow.closeDeleteConfirm,
      closeMasterDirtyWarning: masterFlow.closeDirtyWarning,
      closeMasterNotice: masterFlow.closeNotice,
      clearDetailRowError: detailFlow.clearRowError,
      requestSaveDetailRows: detailFlow.requestSave,
      confirmSaveDetailRows: detailFlow.confirmSave,
      closeDetailSaveConfirm: detailFlow.closeSaveConfirm,
      closeDetailNotice: detailFlow.closeNotice,
    },
    uiProps: {
      selectedMasterId,
      checkedMasterIds,
      draftMasterKeyword,
      isAllMastersChecked,
      pendingFilterAction,
      masterModalProps,
      detailModalProps,
      detailRowErrors: detailFlow.rowErrors,
    },
  };
}
