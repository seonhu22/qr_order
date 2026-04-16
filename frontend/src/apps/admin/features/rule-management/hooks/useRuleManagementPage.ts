import { useMemo, useState } from 'react';
import { useCodeMasterModalFlow } from '@/shared/hooks/useCodeMasterModalFlow';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import type { RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';
import {
  createBlankRuleDetailValues,
  createEmptyRuleDetailSchema,
  createInitialRuleDetailSchemaMap,
  createInitialRuleMasterRows,
  deleteRuleMastersMock,
  hasRuleDetailChanges,
  saveRuleDetailSchemaMock,
  saveRuleMasterMock,
} from '../api/ruleManagementApi';

/**
 * 규칙 관리 페이지의 마스터/상세 상태를 조합한다.
 *
 * @description
 * mock 데이터와 저장 규칙은 adapter 계층으로 분리해 두고,
 * 이 훅은 화면 상태 조합과 이벤트 연결만 담당한다.
 */
export function useRuleManagementPage() {
  const orderedRowEditor = useOrderedRowEditor<RuleDetailRow>();
  const [masterRows, setMasterRows] = useState<RuleMasterRow[]>(createInitialRuleMasterRows);
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [draftMasterKeyword, setDraftMasterKeyword] = useState('');
  const [masterKeyword, setMasterKeyword] = useState('');
  const [baseDetailSchemasByMaster, setBaseDetailSchemasByMaster] = useState<
    Record<string, RuleDetailSchema>
  >(createInitialRuleDetailSchemaMap);
  const [draftDetailSchemasByMaster, setDraftDetailSchemasByMaster] = useState<
    Record<string, RuleDetailSchema>
  >(createInitialRuleDetailSchemaMap);

  const filteredMasterRows = useMemo(() => {
    const normalizedKeyword = masterKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return masterRows;
    }

    return masterRows.filter((row) => {
      const code = row.code.toLowerCase();
      const name = row.name.toLowerCase();
      return code.includes(normalizedKeyword) || name.includes(normalizedKeyword);
    });
  }, [masterRows, masterKeyword]);
  const effectiveSelectedMasterId =
    selectedMasterId && filteredMasterRows.some((row) => row.id === selectedMasterId)
      ? selectedMasterId
      : '';
  const effectiveCheckedMasterIds = checkedMasterIds.filter((id) =>
    filteredMasterRows.some((row) => row.id === id),
  );
  const selectedMaster = useMemo(
    () => filteredMasterRows.find((row) => row.id === effectiveSelectedMasterId) ?? null,
    [filteredMasterRows, effectiveSelectedMasterId],
  );
  const selectedDetailSchema = selectedMaster
    ? (draftDetailSchemasByMaster[selectedMaster.id] ?? createEmptyRuleDetailSchema())
    : null;
  const baseSelectedDetailSchema = selectedMaster
    ? (baseDetailSchemasByMaster[selectedMaster.id] ?? createEmptyRuleDetailSchema())
    : null;
  const isAllMastersChecked =
    filteredMasterRows.length > 0 && effectiveCheckedMasterIds.length === filteredMasterRows.length;

  const setSelectedDetailRows = (updater: (rows: RuleDetailRow[]) => RuleDetailRow[]) => {
    if (!selectedMaster) {
      return;
    }

    setDraftDetailSchemasByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createEmptyRuleDetailSchema();

      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: updater(currentSchema.rows),
        },
      };
    });
  };

  /**
   * 마스터 행 선택 상태를 갱신한다.
   */
  const handleSelectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  /**
   * 검색 input의 draft 값을 갱신한다.
   */
  const handleMasterKeywordChange = (value: string) => {
    setDraftMasterKeyword(value);
  };

  /**
   * 현재 draft 검색어를 실제 조회 키워드로 적용한다.
   */
  const handleMasterSearch = () => {
    setMasterKeyword(draftMasterKeyword);
  };

  /**
   * 검색 조건과 선택 상태를 초기 상태로 되돌린다.
   */
  const handleMasterReset = () => {
    setDraftMasterKeyword('');
    setMasterKeyword('');
    setSelectedMasterId('');
    setCheckedMasterIds([]);
  };

  /**
   * 마스터 행 체크박스를 토글한다.
   */
  const handleToggleMaster = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  /**
   * 마스터 전체 선택/해제를 전환한다.
   */
  const handleToggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : filteredMasterRows.map((row) => row.id));
  };

  /**
   * 마스터 행을 생성 또는 수정 저장한다.
   * 생성 시 상세 스키마 저장소도 함께 초기화한다.
   */
  const saveMaster = async (row: RuleMasterRow, isCreateMode: boolean) => {
    const { nextMasterRows, savedRow, created } = await saveRuleMasterMock(
      masterRows,
      row,
      isCreateMode,
    );

    setMasterRows(nextMasterRows);

    if (created) {
      setBaseDetailSchemasByMaster((prev) => ({
        ...prev,
        [savedRow.id]: createEmptyRuleDetailSchema(),
      }));
      setDraftDetailSchemasByMaster((prev) => ({
        ...prev,
        [savedRow.id]: createEmptyRuleDetailSchema(),
      }));
    }
  };

  /**
   * 체크된 마스터를 삭제하고, 연결된 상세 상태를 정리한다.
   */
  const deleteMasters = async () => {
    const { nextMasterRows, deletedIds, deletedCount } = await deleteRuleMastersMock(
      masterRows,
      checkedMasterIds,
    );

    if (!deletedCount) {
      return 0;
    }

    setMasterRows(nextMasterRows);
    setCheckedMasterIds([]);

    if (selectedMasterId && deletedIds.has(selectedMasterId)) {
      setSelectedMasterId('');
    }

    setBaseDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );
    setDraftDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );

    return deletedCount;
  };

  /**
   * 상세 셀 값을 변경한다.
   */
  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    setSelectedDetailRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: {
                ...row.values,
                [columnKey]: value,
              },
            }
          : row,
      ),
    );
  };

  /**
   * 선택된 마스터에 신규 상세 행을 추가한다.
   */
  const handleAddDetailRow = () => {
    if (!selectedMaster || !selectedDetailSchema) {
      return;
    }

    const nextRow: RuleDetailRow = {
      id: `rule-detail-${Date.now()}`,
      masterId: selectedMaster.id,
      ordNo: selectedDetailSchema.rows.length + 1,
      isNew: true,
      values: createBlankRuleDetailValues(selectedDetailSchema.columns),
    };

    setSelectedDetailRows((rows) => orderedRowEditor.appendRow(rows, nextRow));
  };

  /**
   * 선택된 상세 행(또는 전달된 rowId)을 삭제한다.
   */
  const handleDeleteDetailRow = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.removeRow(rows, rowId));
  };

  /**
   * 선택된 상세 행을 위로 이동한다.
   */
  const handleMoveDetailRowUp = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowUp(rows, rowId));
  };

  /**
   * 선택된 상세 행을 아래로 이동한다.
   */
  const handleMoveDetailRowDown = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowDown(rows, rowId));
  };

  /**
   * 상세 변경사항이 있을 때만 저장을 수행한다.
   * @returns 저장이 수행되면 true, 저장할 변경이 없거나 대상이 없으면 false
   */
  const saveDetailRows = async () => {
    if (!selectedMaster || !selectedDetailSchema || !baseSelectedDetailSchema) {
      return false;
    }

    if (!hasRuleDetailChanges(baseSelectedDetailSchema, selectedDetailSchema)) {
      return false;
    }

    const { savedSchema } = await saveRuleDetailSchemaMock(selectedDetailSchema);

    setBaseDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: savedSchema,
    }));
    setDraftDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: savedSchema,
    }));

    return true;
  };

  /**
   * 현재 선택된 마스터의 상세에 저장되지 않은 변경이 있으면 true다.
   */
  const isDetailDirty = useMemo(() => {
    if (!selectedMaster || !selectedDetailSchema || !baseSelectedDetailSchema) {
      return false;
    }

    return hasRuleDetailChanges(baseSelectedDetailSchema, selectedDetailSchema);
  }, [selectedMaster, selectedDetailSchema, baseSelectedDetailSchema]);

  /**
   * 상세 저장 전 필수값 검증기.
   *
   * @description
   * page-level orchestration 구조에서는
   * "버튼 클릭 -> 검증 -> 저장 확인 모달 -> 실제 저장"
   * 순서가 페이지 훅에서 관리된다.
   *
   * 이 함수는 그중 첫 단계인 "검증용 에러 맵 생성"만 담당한다.
   */
  const validateDetailRows = useMemo(
    () => () =>
      Object.fromEntries(
        (selectedDetailSchema?.rows ?? []).map((row) => [
          row.id,
          Object.fromEntries(
            (selectedDetailSchema?.columns ?? [])
              .filter((column) => column.type === 'text' && column.required)
              .map((column) => {
                const value = row.values[column.key];

                return [column.key, typeof value === 'string' ? !value.trim() : true];
              }),
          ),
        ]),
      ),
    [selectedDetailSchema],
  );

  /**
   * 마스터 영역 모달 흐름.
   *
   * @description
   * 신규/수정 editor, 저장 확인, 삭제 확인, 완료 안내를 한 곳에서 관리한다.
   * 페이지는 이 상태를 받아 실제 모달 컴포넌트를 렌더링만 한다.
   */
  const masterFlow = useCodeMasterModalFlow({
    checkedRowIds: effectiveCheckedMasterIds,
    createEmptyRow: (): RuleMasterRow => ({ id: '', code: '', name: '', useYn: 'Y' }),
    onSaveRow: saveMaster,
    onDeleteRows: deleteMasters,
  });

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

  /**
   * 상세 영역 저장 흐름.
   *
   * @description
   * 상세는 별도 editor 모달이 없고
   * "검증 -> 저장 확인 -> 완료 안내"만 필요하므로
   * useDetailTableSaveFlow를 사용한다.
   */
  const detailFlow = useDetailTableSaveFlow({
    isDirty: isDetailDirty,
    validateRows: validateDetailRows,
    onSaveRows: saveDetailRows,
  });

  /**
   * 상세 저장 확인 모달에서 실제 저장이 진행 중인 상태.
   *
   * @description
   * 단순 "상세 영역 전체가 저장 중"이 아니라,
   * 사용자가 확인 버튼을 누른 뒤 저장 요청이 진행 중인 상태를 뜻한다.
   */
  const isConfirmingDetailSave = detailFlow.isConfirming;

  /**
   * page가 직접 shared flow 내부 구조를 알지 않도록,
   * 실제 렌더링에 필요한 모달 전용 값만 가공해 전달한다.
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
      selectedDeleteCount: masterFlow.selectedDeleteCount,
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
      isLoading: isConfirmingDetailSave,
    },
    notice: {
      open: !!detailFlow.notice,
      title: detailFlow.notice?.title ?? '알림',
      description: detailFlow.notice?.description,
    },
  };

  /**
   * page 컴포넌트가 소비할 최종 반환 구조.
   *
   * @description
   * - data: 화면 표시 데이터
   * - status: 로딩/저장 상태
   * - actions: 이벤트 핸들러
   * - uiProps: 선택 상태와 모달 flow 상태
   *
   * page는 이 구조만 받아 조립하고,
   * 내부 구현 세부사항은 feature hook 안에 숨기는 것이 목적이다.
   */
  return {
    data: {
      masterRows: filteredMasterRows,
      selectedMaster,
      detailColumns: selectedDetailSchema?.columns ?? [],
      detailRows: selectedDetailSchema?.rows ?? [],
    },
    status: {
      isLoadingMasters: false,
      isErrorMasters: false,
      isLoadingDetails: false,
      isConfirmingDetailSave,
    },
    actions: {
      handleMasterKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      confirmFilterAction,
      cancelFilterAction,
      handleSelectMaster,
      handleToggleMaster,
      handleToggleAllMasters,
      handleChangeDetailValue,
      handleAddDetailRow,
      handleDeleteDetailRow,
      handleMoveDetailRowUp,
      handleMoveDetailRowDown,
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
