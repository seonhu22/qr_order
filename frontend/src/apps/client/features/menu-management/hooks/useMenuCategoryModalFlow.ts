import { useMemo, useState } from 'react';
import type { MenuCategoryRow } from '../types';

export type MenuCategoryNoticeState = {
  title: string;
  description: string;
  helperText?: string;
} | null;

type UseMenuCategoryModalFlowParams = {
  checkedRowIds: string[];
  nextOrdNo: number;
  onSaveRow: (row: MenuCategoryRow, isCreateMode: boolean) => Promise<void>;
  onDeleteRows: () => Promise<number>;
};

/**
 * 카테고리 마스터 목록의 등록/수정/삭제 모달 흐름을 관리한다.
 *
 * @description
 * 카테고리는 코드 없이 명칭/사용여부만 가지므로 `useCodeMasterModalFlow`(코드/명칭/사용여부 3필드)를
 * 그대로 재사용하지 않고 같은 모양의 흐름을 명칭/사용여부 2필드로 직접 구성한다.
 */
export function useMenuCategoryModalFlow({
  checkedRowIds,
  nextOrdNo,
  onSaveRow,
  onDeleteRows,
}: UseMenuCategoryModalFlowParams) {
  const [editingRow, setEditingRow] = useState<MenuCategoryRow | null>(null);
  const [originalRow, setOriginalRow] = useState<MenuCategoryRow | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noticeState, setNoticeState] = useState<MenuCategoryNoticeState>(null);
  const [editorErrors, setEditorErrors] = useState({ name: false, useYn: false });

  const selectedDeleteCount = useMemo(() => {
    if (!editingRow || !checkedRowIds.includes(editingRow.id)) {
      return checkedRowIds.length;
    }

    return checkedRowIds.length - 1;
  }, [checkedRowIds, editingRow]);

  const resetEditorErrors = () => setEditorErrors({ name: false, useYn: false });

  const openCreateModal = () => {
    const blankRow: MenuCategoryRow = { id: '', name: '', useYn: 'Y', ordNo: nextOrdNo };
    setEditingRow(blankRow);
    setOriginalRow(blankRow);
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: MenuCategoryRow) => {
    setEditingRow({ ...row });
    setOriginalRow({ ...row });
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const isDirty =
    editingRow !== null &&
    originalRow !== null &&
    (editingRow.name !== originalRow.name || editingRow.useYn !== originalRow.useYn);

  const forceCloseEditorModal = () => {
    setIsDirtyWarningOpen(false);
    setIsEditorOpen(false);
    setEditingRow(null);
    setOriginalRow(null);
    setIsCreateMode(false);
    resetEditorErrors();
  };

  const closeEditorModal = () => {
    if (isDirty) {
      setIsDirtyWarningOpen(true);
      return;
    }

    forceCloseEditorModal();
  };

  const changeEditingField = (key: 'name' | 'useYn', value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors = {
      name: !editingRow?.name.trim(),
      useYn: editingRow?.useYn !== 'Y' && editingRow?.useYn !== 'N',
    };

    setEditorErrors(nextErrors);

    if (nextErrors.name || nextErrors.useYn) {
      return;
    }

    if (!isCreateMode && !isDirty) {
      setNoticeState({ title: '알림', description: '변경된 내용이 없습니다.' });
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!editingRow) {
      return;
    }

    setIsConfirming(true);
    try {
      await onSaveRow(editingRow, isCreateMode);
      setIsSaveConfirmOpen(false);
      setIsEditorOpen(false);
      setNoticeState({ title: '알림', description: '저장되었습니다.' });
      setEditingRow(null);
      setOriginalRow(null);
      setIsCreateMode(false);
      resetEditorErrors();
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const requestDelete = () => {
    if (selectedDeleteCount === 0) {
      setNoticeState({
        title: '안내',
        description: '항목을 먼저 선택해주세요.',
        helperText: '삭제할 행을 클릭하거나 체크박스로 선택 후 진행하세요.',
      });
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmingDelete(true);
    try {
      const deletedCount = await onDeleteRows();
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '알림',
        description: deletedCount > 1 ? `${deletedCount}건이 삭제되었습니다.` : '삭제되었습니다.',
      });
    } catch (error) {
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  return {
    editingRow,
    isCreateMode,
    isDirty,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    isConfirmingDelete,
    selectedDeleteCount,
    editorErrors,
    noticeState,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    forceCloseEditorModal,
    changeEditingField,
    requestSave,
    confirmSave,
    requestDelete,
    confirmDelete,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    closeDirtyWarning: () => setIsDirtyWarningOpen(false),
    closeNotice: () => setNoticeState(null),
  };
}
