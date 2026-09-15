/**
 * @fileoverview 공통코드 페이지 상태 조합 훅
 *
 * @description
 * - 서버 조회(Query)와 화면 편집 상태(draft)를 한 곳에서 조합한다.
 * - 페이지/테이블 컴포넌트는 이 훅이 제공하는 값과 액션만 사용한다.
 * - 마스터/상세 선택, 체크 상태, 상세 draft 편집, 저장/삭제, 순번 이동까지 담당한다.
 */

import { useMemo, useState } from 'react';
import { useCodeMasterModalFlow } from '@/shared/hooks/useCodeMasterModalFlow';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
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
 * - 상세 원본은 query data를 기준으로 계산하고, draft가 없을 때만 원본을 그대로 사용한다.
 */
export function useCommonCodePageState() {
  const queryClient = useQueryClient();
  const orderedRowEditor = useOrderedRowEditor<DetailCode>();
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  /**
   * 사용자가 실제로 수정하기 시작한 상세 행만 저장하는 draft 저장소.
   *
   * @description
   * key는 마스터 id이고, 값은 해당 마스터의 상세 편집본이다.
   * 아직 수정하지 않은 마스터는 이 객체에 없을 수 있다.
   * 그 경우에는 서버에서 조회한 원본(baseDetailRows)을 그대로 화면에 보여준다.
   */
  const [detailRowsByMaster, setDetailRowsByMaster] = useState<Record<string, DetailCode[]>>({});

  /* 검색 키워드: draft는 입력 중인 값, masterKeyword는 조회에 실제 사용되는 값 */
  const [draftMasterKeyword, setDraftMasterKeyword] = useState('');
  const [masterKeyword, setMasterKeyword] = useState('');

  /* 조회·초기화 dirty guard: useFilterDirtyCheck로 관리 */
  const mastersQuery = useCommonCodeMastersQuery(masterKeyword);
  const saveMasterMutation = useSaveCommonMasterMutation();
  const deleteMastersMutation = useDeleteCommonMastersMutation();
  const masterRows = useMemo(
    () => (mastersQuery.data ?? []).map(mapToCommonMasterModel),
    [mastersQuery.data],
  );
  /**
   * 선택 상태를 effect로 "고치는" 대신, 실제로 사용할 때만 유효성을 다시 계산한다.
   *
   * @description
   * 예를 들어 선택했던 마스터가 검색/삭제로 목록에서 사라져도
   * state를 effect에서 비우지 않는다.
   * 대신 "현재 목록에 실제로 존재하는 선택값인가?"를 여기서 판단해
   * 유효한 경우에만 selected id로 사용한다.
   */
  const effectiveSelectedMasterId =
    selectedMasterId && masterRows.some((row) => row.id === selectedMasterId)
      ? selectedMasterId
      : '';
  /**
   * 체크된 행도 같은 방식으로 현재 목록에 실제로 남아 있는 값만 사용한다.
   *
   * @description
   * 삭제되거나 검색 결과에서 사라진 id는 여기서 자동으로 걸러진다.
   * 그래서 effect에서 checked state를 다시 정리하지 않아도 된다.
   */
  const effectiveCheckedMasterIds = checkedMasterIds.filter((id) =>
    masterRows.some((row) => row.id === id),
  );
  const detailQuery = useCommonCodeDetailsQuery(effectiveSelectedMasterId);
  const saveDetailsMutation = useSaveCommonDetailsMutation();
  const selectedMaster = masterRows.find((row) => row.id === effectiveSelectedMasterId) ?? null;
  /**
   * 서버에서 막 조회한 "원본 상세 목록".
   *
   * @description
   * 사용자가 아직 수정하지 않았다면 이 값이 그대로 화면에 표시된다.
   * 즉, 이 값은 상세의 base snapshot 역할을 한다.
   */
  const baseDetailRows = useMemo(
    () => (detailQuery.data ?? []).map(mapToCommonDetailModel),
    [detailQuery.data],
  );
  /**
   * 화면에 실제로 보여줄 상세 행 목록.
   *
   * @description
   * 우선순위는 아래와 같다.
   * 1. 현재 마스터에 대한 draft가 있으면 draft 사용
   * 2. 없으면 서버에서 조회한 원본(baseDetailRows) 사용
   *
   * 즉 "수정 전에는 원본", "수정 후에는 draft"라는 규칙이다.
   */
  const detailRows = useMemo(
    () => (selectedMaster ? (detailRowsByMaster[selectedMaster.id] ?? baseDetailRows) : []),
    [selectedMaster, detailRowsByMaster, baseDetailRows],
  );
  const isAllMastersChecked =
    masterRows.length > 0 && effectiveCheckedMasterIds.length === masterRows.length;

  /**
   * 현재 선택된 마스터의 상세에 저장되지 않은 변경이 있으면 true
   *
   * @description
   * draft와 base를 비교해 실제 저장 요청에 new/update/delete 항목이 생기는지 본다.
   * 단순히 입력창을 건드렸는지가 아니라, "서버에 보낼 변경이 있는가" 기준이다.
   */
  const isDetailDirty = useMemo(() => {
    if (!selectedMaster) return false;
    const request = buildCommonDetailRequest(selectedMaster.id, detailRows, baseDetailRows);
    return hasCommonDetailChanges(request);
  }, [selectedMaster, detailRows, baseDetailRows]);

  /**
   * 현재 선택된 마스터의 상세 draft만 안전하게 갱신한다.
   *
   * @description
   * 아직 draft가 없다면 서버 원본(baseDetailRows)을 복사해 최초 draft를 만든 뒤 수정한다.
   * 즉 "처음 편집하는 순간에만 draft를 생성"하는 helper다.
   */
  const updateSelectedDetailRows = (updater: (rows: DetailCode[]) => DetailCode[]) => {
    if (!selectedMaster) {
      return;
    }

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: updater(prev[selectedMaster.id] ?? cloneRows(baseDetailRows)),
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
    // reset은 검색 조건과 편집 상태를 처음 상태로 되돌리는 동작이므로
    // 상세 draft도 함께 비운다.
    setDetailRowsByMaster({});
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

  const addDetailRow = (): string => {
    if (!selectedMaster) {
      return '';
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

    return nextRow.id;
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
  const saveMaster = async (
    master: { id: string; sysId?: string; code: string; name: string; useYn: 'Y' | 'N' },
    isCreateMode: boolean,
  ) => {
    await saveMasterMutation.mutateAsync(master, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masterLists });
  };

  /**
   * 체크된 마스터를 삭제하고 목록/선택 상태를 정리한다.
   *
   * @description
   * 삭제 후에는
   * - 체크 상태 초기화
   * - 현재 선택한 마스터가 삭제 대상이면 선택 해제
   * - 삭제된 마스터의 상세 draft 제거
   * 를 한 번에 처리한다.
   */
  const deleteCheckedMasters = async () => {
    const targets = masterRows.filter((row) => effectiveCheckedMasterIds.includes(row.id));

    if (!targets.length) {
      return 0;
    }

    await deleteMastersMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masterLists });

    if (targets.some((row) => row.id === effectiveSelectedMasterId)) {
      setSelectedMasterId('');
    }

    setCheckedMasterIds([]);
    setDetailRowsByMaster((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([masterId]) => !targets.some((row) => row.id === masterId)),
      ),
    );

    return targets.length;
  };

  /**
   * 상세 draft를 저장 요청으로 변환해 서버에 전송한다.
   *
   * @returns {Promise<boolean>} 실제 변경이 있어 저장을 수행했으면 true, 아니면 false
   *
   * @description
   * 저장에 성공하면 해당 마스터의 draft를 제거한다.
   * 그러면 다음 렌더에서는 invalidated query로 다시 받아온 서버 원본이 화면 기준이 된다.
   */
  const saveDetailRows = async () => {
    if (!selectedMaster) {
      return false;
    }

    const request = buildCommonDetailRequest(selectedMaster.id, detailRows, baseDetailRows);

    if (!hasCommonDetailChanges(request)) {
      return false;
    }

    await saveDetailsMutation.mutateAsync(request);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commonCode.detailLists,
    });
    setDetailRowsByMaster((prev) => {
      const next = { ...prev };
      delete next[selectedMaster.id];
      return next;
    });

    return true;
  };

  const detailFlow = useDetailTableSaveFlow({
    isDirty: isDetailDirty,
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
    checkedRowIds: effectiveCheckedMasterIds,
    createEmptyRow: (): MasterCode => ({ id: '', code: '', name: '', useYn: 'Y' }),
    onSaveRow: saveMaster,
    onDeleteRows: deleteCheckedMasters,
  });

  // 상세 테이블 변경 또는 마스터 추가/수정 모달의 미저장 변경 중 하나라도 있으면 이탈방지
  usePreventLeave(isDetailDirty || masterFlow.isDirty);

  /**
   * page가 shared hook의 내부 구조를 직접 알지 않도록,
   * 화면에서 필요한 모달 값만 한 번 가공해 전달한다.
   */
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
      hasConfirmAction: !!detailFlow.notice?.onConfirm,
    },
  };

  /**
   * page가 소비할 최종 반환 구조.
   *
   * @description
   * - data: 테이블에 보여줄 데이터
   * - status: 로딩/저장 진행 상태
   * - actions: 클릭/입력 이벤트 핸들러
   * - uiProps: 선택 상태, draft 검색어, 모달용 화면 상태
   */
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
      confirmDetailNotice: detailFlow.confirmNotice,
    },
    uiProps: {
      selectedMasterId: effectiveSelectedMasterId,
      checkedMasterIds: effectiveCheckedMasterIds,
      draftMasterKeyword,
      isAllMastersChecked,
      pendingFilterAction,
      masterModalProps,
      detailModalProps,
      detailRowErrors: detailFlow.rowErrors,
    },
  };
}
