import { useMemo, useState } from 'react';
import { useCodeMasterModalFlow } from '@/shared/hooks/useCodeMasterModalFlow';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import type { RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';
import {
  buildRuleDetailRequest,
  createBlankRuleDetailValues,
  createEmptyRuleDetailSchema,
  hasRuleDetailChanges,
  mapToRuleDetailRow,
  mapToRuleMasterRow,
  useDeleteRuleMastersMutation,
  useRuleDetailQuery,
  useRuleMasterQuery,
  useSaveRuleDetailsMutation,
  useSaveRuleMasterMutation,
} from '../api/ruleManagementApi';

// ? cloneRow와 cloneColumns는 객체 참조 문제로 인해 API 레벨에서 제공하는 함수로, 필요 시 외부로 분리 고려
function cloneRows(rows: RuleDetailRow[]) {
  return rows.map((row) => ({
    ...row,
    values: { ...row.values },
  }));
}

function createDraftDetailSchema(baseSchema: RuleDetailSchema): RuleDetailSchema {
  return {
    ...baseSchema,
    columns: baseSchema.columns.map((column) => ({ ...column })),
    rows: cloneRows(baseSchema.rows),
  };
}

// ? 자주 사용할 것 같음, 리펙토링 시 외부로 분리 고려
async function refetchOrThrow<TError>(
  refetch: () => Promise<{ isError: boolean; error: TError | null }>,
  errorMessage: string,
) {
  const result = await refetch();

  if (result.isError) {
    throw result.error instanceof Error ? result.error : new Error(errorMessage);
  }
}

export function useRuleManagementPage() {
  const orderedRowEditor = useOrderedRowEditor<RuleDetailRow>();
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [draftMasterKeyword, setDraftMasterKeyword] = useState('');
  const [masterKeyword, setMasterKeyword] = useState('');
  const [draftDetailSchemasByMaster, setDraftDetailSchemasByMaster] = useState<
    Record<string, RuleDetailSchema>
  >({});

  const mastersQuery = useRuleMasterQuery(masterKeyword);
  const saveMasterMutation = useSaveRuleMasterMutation();
  const deleteMastersMutation = useDeleteRuleMastersMutation();
  const masterRows = useMemo(
    () => (mastersQuery.data ?? []).map(mapToRuleMasterRow),
    [mastersQuery.data],
  );

  const effectiveSelectedMasterId =
    selectedMasterId && masterRows.some((row) => row.id === selectedMasterId)
      ? selectedMasterId
      : '';
  const effectiveCheckedMasterIds = checkedMasterIds.filter((id) =>
    masterRows.some((row) => row.id === id),
  );
  const selectedMaster = masterRows.find((row) => row.id === effectiveSelectedMasterId) ?? null;
  const isAllMastersChecked =
    masterRows.length > 0 && effectiveCheckedMasterIds.length === masterRows.length;

  const detailQuery = useRuleDetailQuery(effectiveSelectedMasterId);
  const saveDetailsMutation = useSaveRuleDetailsMutation();
  const baseDetailRows = useMemo(
    () => (detailQuery.data ?? []).map(mapToRuleDetailRow),
    [detailQuery.data],
  );
  const baseDetailSchema = useMemo(
    () => ({
      ...createEmptyRuleDetailSchema(),
      rows: baseDetailRows,
    }),
    [baseDetailRows],
  );
  const selectedDetailSchema = selectedMaster
    ? (draftDetailSchemasByMaster[selectedMaster.id] ?? baseDetailSchema)
    : createEmptyRuleDetailSchema();

  const isDetailDirty = useMemo(() => {
    const request = buildRuleDetailRequest(selectedDetailSchema.rows, baseDetailSchema.rows);
    return hasRuleDetailChanges(request);
  }, [selectedDetailSchema.rows, baseDetailSchema.rows]);

  const updateSelectedDetailRows = (updater: (rows: RuleDetailRow[]) => RuleDetailRow[]) => {
    if (!selectedMaster) {
      return;
    }

    setDraftDetailSchemasByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createDraftDetailSchema(baseDetailSchema);

      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: updater(currentSchema.rows),
        },
      };
    });
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
    setDraftDetailSchemasByMaster({});
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

  const handleSelectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  const handleToggleMaster = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  const handleToggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : masterRows.map((row) => row.id));
  };

  const saveMaster = async (row: RuleMasterRow, isCreateMode: boolean) => {
    await saveMasterMutation.mutateAsync(row, isCreateMode);
    await refetchOrThrow(mastersQuery.refetch, '저장 후 규칙 목록을 다시 조회하지 못했습니다.');
  };

  const deleteMasters = async () => {
    const targets = masterRows.filter((row) => effectiveCheckedMasterIds.includes(row.id));

    if (!targets.length) {
      return 0;
    }

    await deleteMastersMutation.mutateAsync(targets);
    await refetchOrThrow(mastersQuery.refetch, '삭제 후 규칙 목록을 다시 조회하지 못했습니다.');

    if (targets.some((row) => row.id === effectiveSelectedMasterId)) {
      setSelectedMasterId('');
    }

    setCheckedMasterIds([]);
    setDraftDetailSchemasByMaster((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([masterId]) => !targets.some((row) => row.id === masterId)),
      ),
    );

    return targets.length;
  };

  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    updateSelectedDetailRows((rows) =>
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

  const handleAddDetailRow = (): string => {
    if (!selectedMaster) {
      return '';
    }

    const nextRow: RuleDetailRow = {
      id: `rule-detail-${Date.now()}`,
      masterId: selectedMaster.id,
      ordNo: selectedDetailSchema.rows.length + 1,
      isNew: true,
      values: createBlankRuleDetailValues(selectedDetailSchema.columns),
    };

    setDraftDetailSchemasByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createDraftDetailSchema(baseDetailSchema);

      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: orderedRowEditor.appendRow(currentSchema.rows, nextRow),
        },
      };
    });

    return nextRow.id;
  };

  const handleDeleteDetailRow = (rowId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.removeRow(rows, rowId));
  };

  const handleMoveDetailRowUp = (rowId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.moveRowUp(rows, rowId));
  };

  const handleMoveDetailRowDown = (rowId?: string) => {
    updateSelectedDetailRows((rows) => orderedRowEditor.moveRowDown(rows, rowId));
  };

  const saveDetailRows = async () => {
    if (!selectedMaster) {
      return false;
    }

    const request = buildRuleDetailRequest(selectedDetailSchema.rows, baseDetailSchema.rows);

    if (!hasRuleDetailChanges(request)) {
      return false;
    }

    await saveDetailsMutation.mutateAsync(request);
    await refetchOrThrow(detailQuery.refetch, '저장 후 규칙 상세를 다시 조회하지 못했습니다.');
    setDraftDetailSchemasByMaster((prev) => {
      const next = { ...prev };
      delete next[selectedMaster.id];
      return next;
    });

    return true;
  };

  const validateDetailRows = useMemo(
    () => () =>
      Object.fromEntries(
        selectedDetailSchema.rows.map((row) => [
          row.id,
          Object.fromEntries(
            selectedDetailSchema.columns
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

  const masterFlow = useCodeMasterModalFlow({
    checkedRowIds: effectiveCheckedMasterIds,
    createEmptyRow: (): RuleMasterRow => ({ id: '', code: '', name: '', useYn: 'Y' }),
    onSaveRow: saveMaster,
    onDeleteRows: deleteMasters,
  });

  const detailFlow = useDetailTableSaveFlow({
    isDirty: isDetailDirty,
    validateRows: validateDetailRows,
    onSaveRows: saveDetailRows,
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
      isLoading: detailFlow.isConfirming,
    },
    notice: {
      open: !!detailFlow.notice,
      title: detailFlow.notice?.title ?? '알림',
      description: detailFlow.notice?.description,
      hasConfirmAction: !!detailFlow.notice?.onConfirm,
    },
  };

  return {
    data: {
      masterRows,
      selectedMaster,
      detailColumns: selectedDetailSchema.columns,
      detailRows: selectedDetailSchema.rows,
    },
    status: {
      isLoadingMasters: mastersQuery.isLoading,
      isErrorMasters: mastersQuery.isError,
      isLoadingDetails: detailQuery.isLoading,
      isConfirmingDetailSave: detailFlow.isConfirming,
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
