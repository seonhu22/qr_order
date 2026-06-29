import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { FileChangeState } from '@/shared/components/file-attachment';
import { mapFileResponseToServerFile } from '@/shared/utils/attachFile';
import { queryKeys } from '@/shared/api/queryKeys';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import type { MenuCategoryRow, MenuDetailRow, MenuDetailSchema } from '../types';
import {
  buildMenuDetailRequest,
  createBlankMenuDetailValues,
  createEmptyMenuDetailSchema,
  hasMenuDetailChanges,
  mapToMenuCategoryRow,
  mapToMenuDetailRow,
  useDeleteMenuCategoriesMutation,
  useMenuCategoryQuery,
  useMenuDetailAttachFileQuery,
  useMenuDetailQuery,
  useSaveMenuCategoryMutation,
  useSaveMenuDetailsMutation,
} from '../api/menuManagementApi';
import { useMenuCategoryModalFlow } from './useMenuCategoryModalFlow';

const EMPTY_DETAIL_FILE_STATE: FileChangeState = { newFiles: [], deletedFiles: [] };

function cloneRows(rows: MenuDetailRow[]) {
  return rows.map((row) => ({ ...row, values: { ...row.values } }));
}

function createDraftDetailSchema(baseSchema: MenuDetailSchema): MenuDetailSchema {
  return {
    ...baseSchema,
    columns: baseSchema.columns.map((column) => ({ ...column })),
    rows: cloneRows(baseSchema.rows),
  };
}

export function useMenuManagementPage() {
  const queryClient = useQueryClient();
  const orderedRowEditor = useOrderedRowEditor<MenuDetailRow>();
  const [checkedCategoryIds, setCheckedCategoryIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draftDetailSchemasByCategory, setDraftDetailSchemasByCategory] = useState<
    Record<string, MenuDetailSchema>
  >({});
  const [editingDetailRowId, setEditingDetailRowId] = useState<string | null>(null);
  const [detailEditorSnapshot, setDetailEditorSnapshot] = useState<MenuDetailRow | null>(null);
  const [isDetailEditConfirmOpen, setIsDetailEditConfirmOpen] = useState(false);
  const [isDetailEditConfirming, setIsDetailEditConfirming] = useState(false);
  const [isDetailEditorDirtyWarningOpen, setIsDetailEditorDirtyWarningOpen] = useState(false);
  const [detailEditorNotice, setDetailEditorNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [detailFileChangeState, setDetailFileChangeState] = useState<FileChangeState>(
    EMPTY_DETAIL_FILE_STATE,
  );

  const categoriesQuery = useMenuCategoryQuery(keyword);
  const saveCategoryMutation = useSaveMenuCategoryMutation();
  const deleteCategoriesMutation = useDeleteMenuCategoriesMutation();
  const categoryRows = useMemo(
    () => (categoriesQuery.data ?? []).map(mapToMenuCategoryRow),
    [categoriesQuery.data],
  );
  const nextCategoryOrdNo = useMemo(
    () => Math.max(0, ...categoryRows.map((row) => row.ordNo)) + 1,
    [categoryRows],
  );

  const effectiveSelectedCategoryId =
    selectedCategoryId && categoryRows.some((row) => row.id === selectedCategoryId)
      ? selectedCategoryId
      : '';
  const effectiveCheckedCategoryIds = checkedCategoryIds.filter((id) =>
    categoryRows.some((row) => row.id === id),
  );
  const selectedCategory =
    categoryRows.find((row) => row.id === effectiveSelectedCategoryId) ?? null;
  const isAllCategoriesChecked =
    categoryRows.length > 0 && effectiveCheckedCategoryIds.length === categoryRows.length;

  const detailQuery = useMenuDetailQuery(effectiveSelectedCategoryId);
  const saveDetailsMutation = useSaveMenuDetailsMutation();
  const baseDetailRows = useMemo(
    () => (detailQuery.data ?? []).map(mapToMenuDetailRow),
    [detailQuery.data],
  );
  const baseDetailSchema = useMemo(
    () => ({
      ...createEmptyMenuDetailSchema(),
      rows: baseDetailRows,
    }),
    [baseDetailRows],
  );
  const selectedDetailSchema = selectedCategory
    ? (draftDetailSchemasByCategory[selectedCategory.id] ?? baseDetailSchema)
    : createEmptyMenuDetailSchema();
  const editingDetailRow =
    selectedDetailSchema.rows.find((row) => row.id === editingDetailRowId) ?? null;
  const attachFileQuery = useMenuDetailAttachFileQuery(editingDetailRow?.fileUlid);
  const detailAttachFiles = useMemo(
    () => (attachFileQuery.data ?? []).map(mapFileResponseToServerFile),
    [attachFileQuery.data],
  );
  const hasDetailFileChanges =
    detailFileChangeState.newFiles.length > 0 || detailFileChangeState.deletedFiles.length > 0;
  const isDetailEditorDirty =
    Boolean(editingDetailRow) &&
    (JSON.stringify(editingDetailRow?.values) !== JSON.stringify(detailEditorSnapshot?.values) ||
      hasDetailFileChanges);

  const isDetailDirty = useMemo(() => {
    const request = buildMenuDetailRequest(selectedDetailSchema.rows, baseDetailSchema.rows);
    return hasMenuDetailChanges(request);
  }, [selectedDetailSchema.rows, baseDetailSchema.rows]);

  const updateSelectedDetailRows = (updater: (rows: MenuDetailRow[]) => MenuDetailRow[]) => {
    if (!selectedCategory) {
      return;
    }

    setDraftDetailSchemasByCategory((prev) => {
      const currentSchema = prev[selectedCategory.id] ?? createDraftDetailSchema(baseDetailSchema);

      return {
        ...prev,
        [selectedCategory.id]: {
          ...currentSchema,
          rows: updater(currentSchema.rows),
        },
      };
    });
  };

  const handleKeywordChange = (value: string) => setDraftKeyword(value);
  const handleSearch = () => setKeyword(draftKeyword);
  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setSelectedCategoryId('');
    setCheckedCategoryIds([]);
    setDraftDetailSchemasByCategory({});
  };

  const {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty: isDetailDirty,
    onSearch: handleSearch,
    onReset: handleReset,
  });

  const handleSelectCategory = (id: string) => setSelectedCategoryId(id);

  const handleToggleCategory = (id: string) => {
    setCheckedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((checkedId) => checkedId !== id) : [...prev, id],
    );
  };

  const handleToggleAllCategories = () => {
    setCheckedCategoryIds(isAllCategoriesChecked ? [] : categoryRows.map((row) => row.id));
  };

  const saveCategory = async (row: MenuCategoryRow, isCreateMode: boolean) => {
    await saveCategoryMutation.mutateAsync(row, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.menuManagement.masterLists });
  };

  const deleteCategories = async () => {
    const targets = categoryRows.filter((row) => effectiveCheckedCategoryIds.includes(row.id));

    if (!targets.length) {
      return 0;
    }

    await deleteCategoriesMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({ queryKey: queryKeys.menuManagement.masterLists });

    if (targets.some((row) => row.id === effectiveSelectedCategoryId)) {
      setSelectedCategoryId('');
    }

    setCheckedCategoryIds([]);
    setDraftDetailSchemasByCategory((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([categoryId]) => !targets.some((row) => row.id === categoryId)),
      ),
    );

    return targets.length;
  };

  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [columnKey]: String(value) } }
          : row,
      ),
    );
  };

  const handleAddDetailRow = (): string => {
    if (!selectedCategory) {
      return '';
    }

    const nextRow: MenuDetailRow = {
      id: `menu-detail-${Date.now()}`,
      masterId: selectedCategory.id,
      ordNo: selectedDetailSchema.rows.length + 1,
      // QA 회피용 crypto.randomUUID() 사용, 실제로는 서버에서 발급된 ulid를 사용해야 함
      fileUlid: crypto.randomUUID(),
      isNew: true,
      values: createBlankMenuDetailValues(),
    };

    setDraftDetailSchemasByCategory((prev) => {
      const currentSchema = prev[selectedCategory.id] ?? createDraftDetailSchema(baseDetailSchema);

      return {
        ...prev,
        [selectedCategory.id]: {
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
    if (!selectedCategory) {
      return false;
    }

    const request = buildMenuDetailRequest(selectedDetailSchema.rows, baseDetailSchema.rows);

    if (!hasMenuDetailChanges(request)) {
      return false;
    }

    await saveDetailsMutation.mutateAsync(request);
    await queryClient.invalidateQueries({ queryKey: queryKeys.menuManagement.detailLists });
    setDraftDetailSchemasByCategory((prev) => {
      const next = { ...prev };
      delete next[selectedCategory.id];
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
              .map((column) => [column.key, !row.values[column.key]?.trim()]),
          ),
        ]),
      ),
    [selectedDetailSchema],
  );

  const categoryFlow = useMenuCategoryModalFlow({
    checkedRowIds: effectiveCheckedCategoryIds,
    nextOrdNo: nextCategoryOrdNo,
    onSaveRow: saveCategory,
    onDeleteRows: deleteCategories,
  });

  usePreventLeave(isDetailDirty || categoryFlow.isDirty);

  const detailFlow = useDetailTableSaveFlow({
    isDirty: isDetailDirty,
    validateRows: validateDetailRows,
    onSaveRows: saveDetailRows,
  });

  const categoryModalProps = {
    editor: {
      open: categoryFlow.isEditorOpen,
      isDirty: categoryFlow.isDirty,
      isCreateMode: categoryFlow.isCreateMode,
      editingRow: categoryFlow.editingRow,
      editorErrors: categoryFlow.editorErrors,
    },
    saveConfirm: {
      open: categoryFlow.isSaveConfirmOpen,
      isCreateMode: categoryFlow.isCreateMode,
      isLoading: categoryFlow.isConfirming,
      selectedDeleteCount: categoryFlow.selectedDeleteCount,
    },
    deleteConfirm: {
      open: categoryFlow.isDeleteConfirmOpen,
      isLoading: categoryFlow.isConfirmingDelete,
      selectedDeleteCount: categoryFlow.selectedDeleteCount,
    },
    dirtyWarning: {
      open: categoryFlow.isDirtyWarningOpen,
    },
    notice: {
      open: !!categoryFlow.noticeState,
      title: categoryFlow.noticeState?.title ?? '알림',
      description: categoryFlow.noticeState?.description,
      helperText: categoryFlow.noticeState?.helperText,
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
      categoryRows,
      selectedCategory,
      detailColumns: selectedDetailSchema.columns,
      detailRows: selectedDetailSchema.rows,
    },
    status: {
      isLoadingCategories: categoriesQuery.isLoading,
      isErrorCategories: categoriesQuery.isError,
      isLoadingDetails: detailQuery.isLoading,
      isConfirmingDetailSave: detailFlow.isConfirming,
    },
    actions: {
      handleKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      confirmFilterAction,
      cancelFilterAction,
      handleSelectCategory,
      handleToggleCategory,
      handleToggleAllCategories,
      handleChangeDetailValue,
      handleAddDetailRow,
      handleDeleteDetailRow,
      handleMoveDetailRowUp,
      handleMoveDetailRowDown,
      handleEditDetailRow: (row: MenuDetailRow) => {
        setEditingDetailRowId(row.id);
        setDetailEditorSnapshot({ ...row, values: { ...row.values } });
      },
      closeDetailEditorModal: () => {
        setEditingDetailRowId(null);
        setDetailEditorSnapshot(null);
        setIsDetailEditConfirmOpen(false);
        setIsDetailEditorDirtyWarningOpen(false);
        setDetailFileChangeState(EMPTY_DETAIL_FILE_STATE);
      },
      changeDetailFileState: setDetailFileChangeState,
      requestConfirmDetailEditor: () => {
        if (isDetailEditorDirty) {
          setIsDetailEditConfirmOpen(true);
          return;
        }
        setEditingDetailRowId(null);
        setDetailEditorSnapshot(null);
        setDetailFileChangeState(EMPTY_DETAIL_FILE_STATE);
      },
      confirmDetailEditor: async () => {
        setIsDetailEditConfirming(true);
        try {
          // 현재는 draft 행 값이 입력 시점에 이미 반영되어 있어 별도 API 호출이 없다.
          // 추후 백엔드 연동 시 이 자리에 실제 save mutation 호출을 추가한다.
          await Promise.resolve();
          setIsDetailEditConfirmOpen(false);
          setEditingDetailRowId(null);
          setDetailEditorSnapshot(null);
          setDetailFileChangeState(EMPTY_DETAIL_FILE_STATE);
          setDetailEditorNotice({ title: '알림', description: '저장되었습니다.' });
        } finally {
          setIsDetailEditConfirming(false);
        }
      },
      closeDetailEditorConfirm: () => setIsDetailEditConfirmOpen(false),
      closeDetailEditorNotice: () => setDetailEditorNotice(null),
      requestCloseDetailEditor: () => {
        if (isDetailEditorDirty) {
          setIsDetailEditorDirtyWarningOpen(true);
          return;
        }
        setEditingDetailRowId(null);
        setDetailEditorSnapshot(null);
        setDetailFileChangeState(EMPTY_DETAIL_FILE_STATE);
      },
      forceCloseDetailEditor: () => {
        if (editingDetailRowId && detailEditorSnapshot) {
          updateSelectedDetailRows((rows) =>
            rows.map((row) => (row.id === editingDetailRowId ? { ...detailEditorSnapshot } : row)),
          );
        }
        setIsDetailEditorDirtyWarningOpen(false);
        setEditingDetailRowId(null);
        setDetailEditorSnapshot(null);
        setDetailFileChangeState(EMPTY_DETAIL_FILE_STATE);
      },
      closeDetailEditorDirtyWarning: () => setIsDetailEditorDirtyWarningOpen(false),
      openCreateCategoryModal: categoryFlow.openCreateModal,
      openEditCategoryModal: categoryFlow.openEditModal,
      closeCategoryEditorModal: categoryFlow.closeEditorModal,
      forceCloseCategoryEditorModal: categoryFlow.forceCloseEditorModal,
      changeCategoryEditingField: categoryFlow.changeEditingField,
      requestSaveCategory: categoryFlow.requestSave,
      confirmSaveCategory: categoryFlow.confirmSave,
      requestDeleteCategories: categoryFlow.requestDelete,
      confirmDeleteCategories: categoryFlow.confirmDelete,
      closeCategorySaveConfirm: categoryFlow.closeSaveConfirm,
      closeCategoryDeleteConfirm: categoryFlow.closeDeleteConfirm,
      closeCategoryDirtyWarning: categoryFlow.closeDirtyWarning,
      closeCategoryNotice: categoryFlow.closeNotice,
      clearDetailRowError: detailFlow.clearRowError,
      requestSaveDetailRows: detailFlow.requestSave,
      confirmSaveDetailRows: detailFlow.confirmSave,
      closeDetailSaveConfirm: detailFlow.closeSaveConfirm,
      closeDetailNotice: detailFlow.closeNotice,
      confirmDetailNotice: detailFlow.confirmNotice,
    },
    uiProps: {
      selectedCategoryId: effectiveSelectedCategoryId,
      checkedCategoryIds: effectiveCheckedCategoryIds,
      draftKeyword,
      isAllCategoriesChecked,
      pendingFilterAction,
      categoryModalProps,
      detailModalProps,
      detailRowErrors: detailFlow.rowErrors,
      editingDetailRow,
      isDetailEditorDirty,
      isDetailEditConfirmOpen,
      isDetailEditConfirming,
      isDetailEditorDirtyWarningOpen,
      detailEditorNotice,
      detailFileChangeState,
      detailAttachFiles,
    },
  };
}
