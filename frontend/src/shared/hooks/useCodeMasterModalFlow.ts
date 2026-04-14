import { useMemo, useState } from 'react';

export type CodeMasterRow = {
  id: string;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
};

export type CodeMasterNoticeState = {
  title: string;
  description: string;
  helperText?: string;
} | null;

type UseCodeMasterModalFlowParams<T extends CodeMasterRow> = {
  checkedRowIds: string[];
  createEmptyRow: () => T;
  onSaveRow: (row: T, isCreateMode: boolean) => Promise<void>;
  onDeleteRows: () => Promise<number>;
  saveErrorMessage?: string;
  deleteErrorMessage?: string;
};

/**
 * 코드/이름/사용여부 구조를 가진 마스터 테이블의 공통 CRUD 모달 흐름을 관리한다.
 *
 * @description
 * - 신규/수정용 editor draft
 * - 저장 확인 모달
 * - 삭제 확인 모달
 * - 기본 안내 모달
 * 을 한곳에 모아 feature 테이블 컴포넌트는 렌더링에만 집중하게 만든다.
 */
export function useCodeMasterModalFlow<T extends CodeMasterRow>({
  checkedRowIds,
  createEmptyRow,
  onSaveRow,
  onDeleteRows,
  saveErrorMessage = '저장 중 오류가 발생했습니다.',
  deleteErrorMessage = '삭제 중 오류가 발생했습니다.',
}: UseCodeMasterModalFlowParams<T>) {
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [originalRow, setOriginalRow] = useState<T | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noticeState, setNoticeState] = useState<CodeMasterNoticeState>(null);
  const [editorErrors, setEditorErrors] = useState({
    code: false,
    name: false,
    useYn: false,
  });

  const selectedDeleteCount = useMemo(() => {
    if (!editingRow || !checkedRowIds.includes(editingRow.id)) {
      return checkedRowIds.length;
    }

    return checkedRowIds.length - 1;
  }, [checkedRowIds, editingRow]);

  const resetEditorErrors = () => {
    setEditorErrors({
      code: false,
      name: false,
      useYn: false,
    });
  };

  const openCreateModal = () => {
    const blankRow = createEmptyRow();
    setEditingRow(blankRow);
    setOriginalRow(blankRow);
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: T) => {
    setEditingRow({ ...row });
    setOriginalRow({ ...row });
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const isDirty =
    editingRow !== null &&
    originalRow !== null &&
    (editingRow.code !== originalRow.code ||
      editingRow.name !== originalRow.name ||
      editingRow.useYn !== originalRow.useYn);

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

  const changeEditingField = (key: 'code' | 'name' | 'useYn', value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors = {
      code: !editingRow?.code.trim(),
      name: !editingRow?.name.trim(),
      useYn: editingRow?.useYn !== 'Y' && editingRow?.useYn !== 'N',
    };

    setEditorErrors(nextErrors);

    if (nextErrors.code || nextErrors.name || nextErrors.useYn) {
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
        description: error instanceof Error ? error.message : saveErrorMessage,
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
        description: error instanceof Error ? error.message : deleteErrorMessage,
      });
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  return {
    editingRow,
    isCreateMode,
    isCodeReadonly: !isCreateMode,
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
