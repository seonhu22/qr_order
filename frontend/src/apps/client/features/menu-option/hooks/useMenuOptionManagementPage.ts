import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { FileChangeState } from '@/shared/components/file-attachment';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';
import type {
  MenuOptionDetailRow,
  MenuOptionDetailSchema,
  MenuOptionGroupRow,
  MenuOptionGroupSchema,
} from '../types';
import {
  buildMenuOptionDetailRequest,
  buildMenuOptionGroupChanges,
  createBlankMenuOptionDetailValues,
  createBlankMenuOptionGroupValues,
  createEmptyMenuOptionGroupSchema,
  getMenuOptionDetailColumns,
  hasMenuOptionDetailChanges,
  hasMenuOptionGroupChanges,
  mapToMenuOptionDetailRow,
  mapToMenuOptionGroupRow,
  mapToMenuOptionMasterRow,
  useMenuOptionDetailAttachFileQuery,
  useMenuOptionDetailQuery,
  useMenuOptionGroupQuery,
  useMenuOptionMasterQuery,
  useSaveMenuOptionDetailsMutation,
  useSaveMenuOptionGroupsMutation,
} from '../api/menuOptionApi';

const EMPTY_OPTION_DETAIL_FILE_STATE: FileChangeState = { newFiles: [], deletedFiles: [] };

function cloneGroupRows(rows: MenuOptionGroupRow[]) {
  return rows.map((row) => ({ ...row, values: { ...row.values } }));
}

function cloneDetailRows(rows: MenuOptionDetailRow[]) {
  return rows.map((row) => ({ ...row, values: { ...row.values } }));
}

function cloneColumns(columns: EditableDetailColumn[]) {
  return columns.map((column) => ({ ...column }));
}

function createDraftGroupSchema(baseSchema: MenuOptionGroupSchema): MenuOptionGroupSchema {
  return {
    columns: cloneColumns(baseSchema.columns),
    rows: cloneGroupRows(baseSchema.rows),
  };
}

function validateRequiredColumns(
  rows: { id: string; values: Record<string, unknown> }[],
  columns: EditableDetailColumn[],
): DetailRowErrorState {
  const requiredColumns = columns.filter(
    (column) => column.required && (column.type === 'text' || column.type === 'select'),
  );

  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      Object.fromEntries(
        requiredColumns.map((column) => {
          const value = row.values[column.key];
          const isBlank = typeof value === 'string' ? !value.trim() : !value;
          return [column.key, isBlank];
        }),
      ),
    ]),
  );
}

export function useMenuOptionManagementPage() {
  const queryClient = useQueryClient();
  const groupRowEditor = useOrderedRowEditor<MenuOptionGroupRow>();
  const detailRowEditor = useOrderedRowEditor<MenuOptionDetailRow>();

  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draftGroupSchemaByMaster, setDraftGroupSchemaByMaster] = useState<
    Record<string, MenuOptionGroupSchema>
  >({});
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [draftDetailRowsByGroup, setDraftDetailRowsByGroup] = useState<
    Record<string, MenuOptionDetailRow[]>
  >({});
  const [editingOptionDetailRowId, setEditingOptionDetailRowId] = useState<string | null>(null);
  const [optionDetailEditorSnapshot, setOptionDetailEditorSnapshot] =
    useState<MenuOptionDetailRow | null>(null);
  const [isOptionDetailEditConfirmOpen, setIsOptionDetailEditConfirmOpen] = useState(false);
  const [isOptionDetailEditConfirming, setIsOptionDetailEditConfirming] = useState(false);
  const [isOptionDetailEditorDirtyWarningOpen, setIsOptionDetailEditorDirtyWarningOpen] =
    useState(false);
  const [optionDetailEditorNotice, setOptionDetailEditorNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [optionDetailFileChangeState, setOptionDetailFileChangeState] = useState<FileChangeState>(
    EMPTY_OPTION_DETAIL_FILE_STATE,
  );
  const [pendingGroupInputTypeChange, setPendingGroupInputTypeChange] = useState<{
    rowId: string;
    nextValue: string;
  } | null>(null);
  const [blockedActionNoticeMessage, setBlockedActionNoticeMessage] = useState<string | null>(
    null,
  );
  /**
   * 옵션/수량을 바꾼 그룹의 id. 고객 화면에 보여줄 UI(주문 옵션/수량 설정)가 달라지므로,
   * 해당 그룹의 옵션 항목이 새 컬럼 기준으로 저장되기 전에는 그룹 저장을 막는다.
   */
  const [groupIdNeedingDetailSync, setGroupIdNeedingDetailSync] = useState<string | null>(null);

  const mastersQuery = useMenuOptionMasterQuery(keyword);
  const masterRows = useMemo(
    () => (mastersQuery.data ?? []).map(mapToMenuOptionMasterRow),
    [mastersQuery.data],
  );

  const effectiveSelectedMasterId =
    selectedMasterId && masterRows.some((row) => row.id === selectedMasterId)
      ? selectedMasterId
      : '';
  const selectedMaster = masterRows.find((row) => row.id === effectiveSelectedMasterId) ?? null;

  const groupQuery = useMenuOptionGroupQuery(effectiveSelectedMasterId);
  const saveGroupsMutation = useSaveMenuOptionGroupsMutation();
  const baseGroupRows = useMemo(
    () => (groupQuery.data ?? []).map(mapToMenuOptionGroupRow),
    [groupQuery.data],
  );
  const baseGroupSchema = useMemo(
    () => ({ ...createEmptyMenuOptionGroupSchema(), rows: baseGroupRows }),
    [baseGroupRows],
  );
  const selectedGroupSchema = selectedMaster
    ? (draftGroupSchemaByMaster[selectedMaster.id] ?? baseGroupSchema)
    : createEmptyMenuOptionGroupSchema();

  const effectiveSelectedGroupId =
    selectedGroupId && selectedGroupSchema.rows.some((row) => row.id === selectedGroupId)
      ? selectedGroupId
      : '';
  const selectedGroupRow =
    selectedGroupSchema.rows.find((row) => row.id === effectiveSelectedGroupId) ?? null;

  const detailQuery = useMenuOptionDetailQuery(effectiveSelectedGroupId);
  const saveDetailsMutation = useSaveMenuOptionDetailsMutation();
  const baseDetailRows = useMemo(
    () => (detailQuery.data ?? []).map(mapToMenuOptionDetailRow),
    [detailQuery.data],
  );
  /**
   * 옵션 항목 컬럼은 선택된 그룹의 inputType에서 항상 새로 계산한다.
   * draft에 columns를 함께 저장하면 inputType 변경 후에도 예전 컬럼이 남는 문제가 있었다.
   */
  const detailColumns = useMemo(
    () => getMenuOptionDetailColumns(selectedGroupRow?.values.inputType),
    [selectedGroupRow?.values.inputType],
  );
  const selectedDetailRows = useMemo(
    () => (selectedGroupRow ? draftDetailRowsByGroup[selectedGroupRow.id] ?? baseDetailRows : []),
    [selectedGroupRow, draftDetailRowsByGroup, baseDetailRows],
  );
  const selectedDetailSchema: MenuOptionDetailSchema = useMemo(
    () => ({ columns: detailColumns, rows: selectedDetailRows }),
    [detailColumns, selectedDetailRows],
  );

  const editingOptionDetailRow =
    selectedDetailSchema.rows.find((row) => row.id === editingOptionDetailRowId) ?? null;
  const optionDetailAttachFileQuery = useMenuOptionDetailAttachFileQuery(
    editingOptionDetailRow?.fileUlid,
  );
  const optionDetailAttachFiles = useMemo(
    () => (optionDetailAttachFileQuery.data ?? []).map(mapFileResponseToServerFile),
    [optionDetailAttachFileQuery.data],
  );
  const hasOptionDetailFileChanges =
    optionDetailFileChangeState.newFiles.length > 0 ||
    optionDetailFileChangeState.deletedFiles.length > 0;
  const isOptionDetailEditorDirty =
    Boolean(editingOptionDetailRow) &&
    (JSON.stringify(editingOptionDetailRow?.values) !==
      JSON.stringify(optionDetailEditorSnapshot?.values) ||
      hasOptionDetailFileChanges);

  const isGroupDirty = useMemo(
    () => hasMenuOptionGroupChanges(buildMenuOptionGroupChanges(selectedGroupSchema.rows, baseGroupSchema.rows)),
    [selectedGroupSchema.rows, baseGroupSchema.rows],
  );
  const isDetailDirty = useMemo(
    () => hasMenuOptionDetailChanges(buildMenuOptionDetailRequest(selectedDetailRows, baseDetailRows)),
    [selectedDetailRows, baseDetailRows],
  );

  const updateSelectedGroupRows = (
    updater: (rows: MenuOptionGroupRow[]) => MenuOptionGroupRow[],
  ) => {
    if (!selectedMaster) return;

    setDraftGroupSchemaByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createDraftGroupSchema(baseGroupSchema);
      return {
        ...prev,
        [selectedMaster.id]: { ...currentSchema, rows: updater(currentSchema.rows) },
      };
    });
  };

  const updateSelectedDetailRows = (
    updater: (rows: MenuOptionDetailRow[]) => MenuOptionDetailRow[],
  ) => {
    if (!selectedGroupRow) return;

    setDraftDetailRowsByGroup((prev) => {
      const currentRows = prev[selectedGroupRow.id] ?? cloneDetailRows(baseDetailRows);
      return { ...prev, [selectedGroupRow.id]: updater(currentRows) };
    });
  };

  const handleKeywordChange = (value: string) => setDraftKeyword(value);
  const handleSearch = () => setKeyword(draftKeyword);
  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setSelectedMasterId('');
    setSelectedGroupId('');
    setDraftGroupSchemaByMaster({});
    setDraftDetailRowsByGroup({});
    setGroupIdNeedingDetailSync(null);
  };

  const {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty: isGroupDirty || isDetailDirty,
    onSearch: handleSearch,
    onReset: handleReset,
  });

  const handleSelectMaster = (id: string) => {
    setSelectedMasterId(id);
    setSelectedGroupId('');
  };

  const handleSelectGroup = (id: string) => setSelectedGroupId(id);

  const applyGroupValueChange = (rowId: string, columnKey: string, value: string | boolean) => {
    updateSelectedGroupRows((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, values: { ...row.values, [columnKey]: value } } : row,
      ),
    );
  };

  /**
   * 옵션/수량(inputType)을 바꾸면 옵션 항목 테이블의 컬럼 구성이 바뀐다.
   * 이미 등록된(서버에 저장된) 옵션 항목이 있는 그룹에서 바꾸려 하면
   * 먼저 확인을 받고, 확인 시 더 이상 쓰이지 않는 수량 설정 값을 초기화한다.
   */
  const handleChangeGroupValue = (rowId: string, columnKey: string, value: string | boolean) => {
    if (
      columnKey === 'inputType' &&
      rowId === selectedGroupRow?.id &&
      value !== selectedGroupRow.values.inputType &&
      baseDetailRows.length > 0
    ) {
      setPendingGroupInputTypeChange({ rowId, nextValue: String(value) });
      return;
    }

    applyGroupValueChange(rowId, columnKey, value);
  };

  const confirmGroupInputTypeChange = () => {
    if (!pendingGroupInputTypeChange) return;

    applyGroupValueChange(
      pendingGroupInputTypeChange.rowId,
      'inputType',
      pendingGroupInputTypeChange.nextValue,
    );
    // 더 이상 쓰이지 않거나 새로 생기는 수량 설정 값은 비워둔다. required 검증이 저장 시 입력을 강제한다.
    updateSelectedDetailRows((rows) =>
      rows.map((row) => ({ ...row, values: { ...row.values, maximumNum: '' } })),
    );
    // 주문 옵션 ↔ 수량 설정은 수량 설정 컬럼 하나만 생기거나 사라지는 차이다.
    // 컬럼이 "새로 생기는"(수량 설정으로 바뀌는) 경우에만 필수값이 비어있을 수 있으므로,
    // 그 경우에만 옵션 항목이 저장되기 전까지 그룹 저장을 막는다.
    if (pendingGroupInputTypeChange.nextValue === '수량 설정') {
      setGroupIdNeedingDetailSync(pendingGroupInputTypeChange.rowId);
    }
    setPendingGroupInputTypeChange(null);
  };

  const cancelGroupInputTypeChange = () => setPendingGroupInputTypeChange(null);

  const handleAddGroupRow = (): string => {
    if (!selectedMaster) return '';

    const nextRow: MenuOptionGroupRow = {
      id: `menu-option-group-${Date.now()}`,
      masterId: selectedMaster.id,
      ordNo: selectedGroupSchema.rows.length + 1,
      isNew: true,
      values: createBlankMenuOptionGroupValues(),
    };

    setDraftGroupSchemaByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createDraftGroupSchema(baseGroupSchema);
      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: groupRowEditor.appendRow(currentSchema.rows, nextRow),
        },
      };
    });

    return nextRow.id;
  };

  const handleDeleteGroupRow = (rowId?: string) => {
    updateSelectedGroupRows((rows) => groupRowEditor.removeRow(rows, rowId));
  };

  const handleMoveGroupRowUp = (rowId?: string) => {
    updateSelectedGroupRows((rows) => groupRowEditor.moveRowUp(rows, rowId));
  };

  const handleMoveGroupRowDown = (rowId?: string) => {
    updateSelectedGroupRows((rows) => groupRowEditor.moveRowDown(rows, rowId));
  };

  const saveGroupRows = async () => {
    if (!selectedMaster) return false;

    const changes = buildMenuOptionGroupChanges(selectedGroupSchema.rows, baseGroupSchema.rows);
    if (!hasMenuOptionGroupChanges(changes)) return false;

    await saveGroupsMutation.mutateAsync(changes);
    await queryClient.invalidateQueries({ queryKey: queryKeys.menuOption.groupLists });
    setDraftGroupSchemaByMaster((prev) => {
      const next = { ...prev };
      delete next[selectedMaster.id];
      return next;
    });

    return true;
  };

  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, values: { ...row.values, [columnKey]: value } } : row,
      ),
    );
  };

  const handleAddDetailRow = (): string => {
    if (!selectedGroupRow) return '';

    if (!selectedGroupRow.sysId) {
      setBlockedActionNoticeMessage('옵션 그룹을 먼저 저장해주세요.');
      return '';
    }

    if (!selectedGroupRow.values.inputType) {
      setBlockedActionNoticeMessage('옵션 그룹의 옵션/수량을 먼저 선택해주세요.');
      return '';
    }

    const nextRow: MenuOptionDetailRow = {
      id: `menu-option-detail-${Date.now()}`,
      groupId: selectedGroupRow.id,
      ordNo: selectedDetailRows.length + 1,
      isNew: true,
      values: createBlankMenuOptionDetailValues(),
    };

    setDraftDetailRowsByGroup((prev) => {
      const currentRows = prev[selectedGroupRow.id] ?? cloneDetailRows(baseDetailRows);
      return {
        ...prev,
        [selectedGroupRow.id]: detailRowEditor.appendRow(currentRows, nextRow),
      };
    });

    return nextRow.id;
  };

  const handleDeleteDetailRow = (rowId?: string) => {
    updateSelectedDetailRows((rows) => detailRowEditor.removeRow(rows, rowId));
  };

  const handleMoveDetailRowUp = (rowId?: string) => {
    updateSelectedDetailRows((rows) => detailRowEditor.moveRowUp(rows, rowId));
  };

  const handleMoveDetailRowDown = (rowId?: string) => {
    updateSelectedDetailRows((rows) => detailRowEditor.moveRowDown(rows, rowId));
  };

  const saveDetailRows = async () => {
    if (!selectedGroupRow) return false;

    // 필수값 검증을 통과해 이 지점까지 왔다는 것 자체가 "옵션 항목 정리"가 끝났다는 뜻이므로,
    // 실제 변경분이 없어도(이미 유효한 값이었던 경우) 그룹 저장 차단을 해제한다.
    if (groupIdNeedingDetailSync === selectedGroupRow.id) {
      setGroupIdNeedingDetailSync(null);
    }

    const request = buildMenuOptionDetailRequest(selectedDetailRows, baseDetailRows);
    if (!hasMenuOptionDetailChanges(request)) return false;

    await saveDetailsMutation.mutateAsync(request);
    await queryClient.invalidateQueries({ queryKey: queryKeys.menuOption.detailLists });
    setDraftDetailRowsByGroup((prev) => {
      const next = { ...prev };
      delete next[selectedGroupRow.id];
      return next;
    });

    return true;
  };

  const validateGroupRows = useMemo(
    () => () => validateRequiredColumns(selectedGroupSchema.rows, selectedGroupSchema.columns),
    [selectedGroupSchema],
  );
  const validateDetailRows = useMemo(
    () => () => validateRequiredColumns(selectedDetailSchema.rows, selectedDetailSchema.columns),
    [selectedDetailSchema],
  );

  const groupFlow = useDetailTableSaveFlow({
    isDirty: isGroupDirty,
    validateRows: validateGroupRows,
    onSaveRows: saveGroupRows,
  });
  const detailFlow = useDetailTableSaveFlow({
    isDirty: isDetailDirty,
    validateRows: validateDetailRows,
    onSaveRows: saveDetailRows,
  });

  usePreventLeave(isGroupDirty || isDetailDirty);

  /**
   * 옵션/수량을 바꾼 그룹은, 옵션 항목이 새 컬럼 기준으로 저장(또는 변경 없음)되기 전까지
   * 그룹 저장을 막는다. 고객 화면 UI(주문 옵션/수량 설정)와 실제 항목 데이터가
   * 어긋난 채로 저장되는 것을 방지하기 위함이다.
   */
  const requestSaveGroupRows = () => {
    if (groupIdNeedingDetailSync && selectedGroupRow?.id === groupIdNeedingDetailSync) {
      setBlockedActionNoticeMessage('옵션 항목 변경사항을 먼저 저장해주세요.');
      return;
    }

    groupFlow.requestSave();
  };

  return {
    data: {
      masterRows,
      selectedMaster,
      selectedGroupRow,
      groupColumns: selectedGroupSchema.columns,
      groupRows: selectedGroupSchema.rows,
      detailColumns: selectedDetailSchema.columns,
      detailRows: selectedDetailSchema.rows,
    },
    status: {
      isLoadingMasters: mastersQuery.isLoading,
      isErrorMasters: mastersQuery.isError,
      isLoadingGroups: groupQuery.isLoading,
      isLoadingDetails: detailQuery.isLoading,
      isSavingGroups: groupFlow.isConfirming,
      isSavingDetails: detailFlow.isConfirming,
    },
    actions: {
      handleKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      confirmFilterAction,
      cancelFilterAction,
      handleSelectMaster,
      handleSelectGroup,
      handleChangeGroupValue,
      handleAddGroupRow,
      handleDeleteGroupRow,
      handleMoveGroupRowUp,
      handleMoveGroupRowDown,
      clearGroupRowError: groupFlow.clearRowError,
      requestSaveGroupRows,
      confirmSaveGroupRows: groupFlow.confirmSave,
      closeGroupSaveConfirm: groupFlow.closeSaveConfirm,
      closeGroupNotice: groupFlow.closeNotice,
      confirmGroupNotice: groupFlow.confirmNotice,
      handleChangeDetailValue,
      handleAddDetailRow,
      handleDeleteDetailRow,
      handleMoveDetailRowUp,
      handleMoveDetailRowDown,
      clearDetailRowError: detailFlow.clearRowError,
      requestSaveDetailRows: detailFlow.requestSave,
      confirmSaveDetailRows: detailFlow.confirmSave,
      closeDetailSaveConfirm: detailFlow.closeSaveConfirm,
      closeDetailNotice: detailFlow.closeNotice,
      confirmDetailNotice: detailFlow.confirmNotice,
      handleEditDetailRow: (row: MenuOptionDetailRow) => {
        setEditingOptionDetailRowId(row.id);
        setOptionDetailEditorSnapshot({ ...row, values: { ...row.values } });
      },
      closeOptionDetailEditorModal: () => {
        setEditingOptionDetailRowId(null);
        setOptionDetailEditorSnapshot(null);
        setIsOptionDetailEditConfirmOpen(false);
        setIsOptionDetailEditorDirtyWarningOpen(false);
        setOptionDetailFileChangeState(EMPTY_OPTION_DETAIL_FILE_STATE);
      },
      changeOptionDetailFileState: setOptionDetailFileChangeState,
      requestConfirmOptionDetailEditor: () => {
        if (isOptionDetailEditorDirty) {
          setIsOptionDetailEditConfirmOpen(true);
          return;
        }
        setEditingOptionDetailRowId(null);
        setOptionDetailEditorSnapshot(null);
        setOptionDetailFileChangeState(EMPTY_OPTION_DETAIL_FILE_STATE);
      },
      confirmOptionDetailEditor: async () => {
        setIsOptionDetailEditConfirming(true);
        try {
          // 현재는 draft 행 값이 입력 시점에 이미 반영되어 있어 별도 API 호출이 없다.
          // 추후 첨부파일 백엔드 연동 시 이 자리에 실제 업로드/save mutation 호출을 추가한다.
          await Promise.resolve();
          setIsOptionDetailEditConfirmOpen(false);
          setEditingOptionDetailRowId(null);
          setOptionDetailEditorSnapshot(null);
          setOptionDetailFileChangeState(EMPTY_OPTION_DETAIL_FILE_STATE);
          setOptionDetailEditorNotice({ title: '알림', description: '저장되었습니다.' });
        } finally {
          setIsOptionDetailEditConfirming(false);
        }
      },
      closeOptionDetailEditorConfirm: () => setIsOptionDetailEditConfirmOpen(false),
      closeOptionDetailEditorNotice: () => setOptionDetailEditorNotice(null),
      requestCloseOptionDetailEditor: () => {
        if (isOptionDetailEditorDirty) {
          setIsOptionDetailEditorDirtyWarningOpen(true);
          return;
        }
        setEditingOptionDetailRowId(null);
        setOptionDetailEditorSnapshot(null);
        setOptionDetailFileChangeState(EMPTY_OPTION_DETAIL_FILE_STATE);
      },
      forceCloseOptionDetailEditor: () => {
        if (editingOptionDetailRowId && optionDetailEditorSnapshot) {
          updateSelectedDetailRows((rows) =>
            rows.map((row) =>
              row.id === editingOptionDetailRowId ? { ...optionDetailEditorSnapshot } : row,
            ),
          );
        }
        setIsOptionDetailEditorDirtyWarningOpen(false);
        setEditingOptionDetailRowId(null);
        setOptionDetailEditorSnapshot(null);
        setOptionDetailFileChangeState(EMPTY_OPTION_DETAIL_FILE_STATE);
      },
      closeOptionDetailEditorDirtyWarning: () => setIsOptionDetailEditorDirtyWarningOpen(false),
      confirmGroupInputTypeChange,
      cancelGroupInputTypeChange,
      closeBlockedActionNotice: () => setBlockedActionNoticeMessage(null),
    },
    uiProps: {
      selectedMasterId: effectiveSelectedMasterId,
      isGroupInputTypeChangeConfirmOpen: pendingGroupInputTypeChange !== null,
      blockedActionNoticeMessage,
      selectedGroupId: effectiveSelectedGroupId,
      draftKeyword,
      pendingFilterAction,
      groupRowErrors: groupFlow.rowErrors,
      groupSaveConfirm: {
        open: groupFlow.isSaveConfirmOpen,
        isLoading: groupFlow.isConfirming,
      },
      groupNotice: {
        open: !!groupFlow.notice,
        title: groupFlow.notice?.title ?? '알림',
        description: groupFlow.notice?.description,
        hasConfirmAction: !!groupFlow.notice?.onConfirm,
      },
      detailRowErrors: detailFlow.rowErrors,
      detailSaveConfirm: {
        open: detailFlow.isSaveConfirmOpen,
        isLoading: detailFlow.isConfirming,
      },
      detailNotice: {
        open: !!detailFlow.notice,
        title: detailFlow.notice?.title ?? '알림',
        description: detailFlow.notice?.description,
        hasConfirmAction: !!detailFlow.notice?.onConfirm,
      },
      editingOptionDetailRow,
      isOptionDetailEditorDirty,
      isOptionDetailEditConfirmOpen,
      isOptionDetailEditConfirming,
      isOptionDetailEditorDirtyWarningOpen,
      optionDetailEditorNotice,
      optionDetailFileChangeState,
      optionDetailAttachFiles,
    },
  };
}
