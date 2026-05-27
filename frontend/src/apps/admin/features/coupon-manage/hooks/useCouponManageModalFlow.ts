import { useState } from 'react';
import type { CouponRow } from '../types';

export type CouponEditorRow = {
  id: string;
  sysId?: string;
  couponCd: string;
  couponNm: string;
  startDate: string;
  endDate: string;
  useYn: 'Y' | 'N';
};

export type CouponEditorErrors = {
  couponCd: boolean;
  couponNm: boolean;
  startDate: boolean;
  endDate: boolean;
  useYn: boolean;
};

export type CouponNoticeState = { title: string; description: string } | null;

type UseCouponManageModalFlowParams = {
  checkedIds: string[];
  onSaveRow: (row: CouponEditorRow, isCreateMode: boolean) => Promise<void>;
  onDeleteRows: () => Promise<number>;
};

const EMPTY_ROW: CouponEditorRow = {
  id: '',
  couponCd: '',
  couponNm: '',
  startDate: '',
  endDate: '',
  useYn: 'Y',
};

const INITIAL_ERRORS: CouponEditorErrors = {
  couponCd: false,
  couponNm: false,
  startDate: false,
  endDate: false,
  useYn: false,
};

function toEditorRow(row: CouponRow): CouponEditorRow {
  return {
    id: row.id,
    sysId: row.sysId,
    couponCd: row.couponCd,
    couponNm: row.couponNm,
    startDate: row.startDate,
    endDate: row.endDate,
    useYn: row.useYn,
  };
}

export function editorRowToCouponRow(row: CouponEditorRow): CouponRow {
  return {
    id: row.id,
    sysId: row.sysId,
    couponCd: row.couponCd,
    couponNm: row.couponNm,
    startDate: row.startDate,
    endDate: row.endDate,
    useYn: row.useYn,
  };
}

export function useCouponManageModalFlow({
  checkedIds,
  onSaveRow,
  onDeleteRows,
}: UseCouponManageModalFlowParams) {
  const [editingRow, setEditingRow] = useState<CouponEditorRow | null>(null);
  const [originalRow, setOriginalRow] = useState<CouponEditorRow | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noticeState, setNoticeState] = useState<CouponNoticeState>(null);
  const [editorErrors, setEditorErrors] = useState<CouponEditorErrors>(INITIAL_ERRORS);

  const isDirty =
    editingRow !== null &&
    originalRow !== null &&
    JSON.stringify(editingRow) !== JSON.stringify(originalRow);

  const resetEditorErrors = () => setEditorErrors(INITIAL_ERRORS);

  const openCreateModal = () => {
    setEditingRow({ ...EMPTY_ROW });
    setOriginalRow({ ...EMPTY_ROW });
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: CouponRow) => {
    const editorRow = toEditorRow(row);
    setEditingRow(editorRow);
    setOriginalRow(editorRow);
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

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

  const changeEditingField = (key: keyof Omit<CouponEditorRow, 'id' | 'sysId'>, value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors: CouponEditorErrors = {
      couponCd: !editingRow?.couponCd.trim(),
      couponNm: !editingRow?.couponNm.trim(),
      startDate: !editingRow?.startDate.trim(),
      endDate: !editingRow?.endDate.trim(),
      useYn: !editingRow?.useYn,
    };

    setEditorErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (!isCreateMode && !isDirty) {
      setNoticeState({ title: '알림', description: '변경된 내용이 없습니다.' });
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!editingRow) return;
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
    if (checkedIds.length === 0) {
      setNoticeState({ title: '안내', description: '항목을 먼저 선택해주세요.' });
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmingDelete(true);
    try {
      const count = await onDeleteRows();
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: '알림',
        description: count > 1 ? `${count}건이 삭제되었습니다.` : '삭제되었습니다.',
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
    isCodeReadonly: !isCreateMode,
    isDirty,
    editorErrors,
    noticeState,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    isConfirmingDelete,
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
