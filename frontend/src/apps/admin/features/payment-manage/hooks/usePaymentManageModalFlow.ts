import { useState } from 'react';
import type { PaymentRateRow } from '../types';

export type PaymentEditorRow = {
  id: string;
  sysId?: string;
  rateCode: string;
  rateName: string;
  rateAmount: string;
  rateUnit: string;
  licenseValidMonth: string;
};

export type PaymentEditorErrors = {
  rateCode: boolean;
  rateName: boolean;
  rateAmount: boolean;
  rateUnit: boolean;
  licenseValidMonth: boolean;
};

export type PaymentNoticeState = { title: string; description: string } | null;

type UsePaymentManageModalFlowParams = {
  checkedIds: string[];
  onSaveRow: (row: PaymentEditorRow, isCreateMode: boolean) => Promise<void>;
  onDeleteRows: () => Promise<number>;
};

const EMPTY_ROW: PaymentEditorRow = {
  id: '',
  rateCode: '',
  rateName: '',
  rateAmount: '',
  rateUnit: '',
  licenseValidMonth: '',
};

const INITIAL_ERRORS: PaymentEditorErrors = {
  rateCode: false,
  rateName: false,
  rateAmount: false,
  rateUnit: false,
  licenseValidMonth: false,
};

function toEditorRow(row: PaymentRateRow): PaymentEditorRow {
  return {
    id: row.id,
    sysId: row.sysId,
    rateCode: row.rateCode,
    rateName: row.rateName,
    rateAmount: String(row.rateAmount),
    rateUnit: row.rateUnit,
    licenseValidMonth: String(row.licenseValidMonth),
  };
}

export function editorRowToPaymentRateRow(row: PaymentEditorRow): PaymentRateRow {
  return {
    id: row.id,
    sysId: row.sysId,
    rateCode: row.rateCode,
    rateName: row.rateName,
    rateAmount: Number(row.rateAmount),
    rateUnit: row.rateUnit,
    licenseValidMonth: Number(row.licenseValidMonth),
  };
}

export function usePaymentManageModalFlow({
  checkedIds,
  onSaveRow,
  onDeleteRows,
}: UsePaymentManageModalFlowParams) {
  const [editingRow, setEditingRow] = useState<PaymentEditorRow | null>(null);
  const [originalRow, setOriginalRow] = useState<PaymentEditorRow | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noticeState, setNoticeState] = useState<PaymentNoticeState>(null);
  const [editorErrors, setEditorErrors] = useState<PaymentEditorErrors>(INITIAL_ERRORS);

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

  const openEditModal = (row: PaymentRateRow) => {
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

  const changeEditingField = (key: keyof Omit<PaymentEditorRow, 'id' | 'sysId'>, value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const amount = editingRow?.rateAmount ?? '';
    const months = editingRow?.licenseValidMonth ?? '';

    const nextErrors: PaymentEditorErrors = {
      rateCode: !editingRow?.rateCode.trim(),
      rateName: !editingRow?.rateName.trim(),
      rateAmount: !amount.trim() || isNaN(Number(amount)) || Number(amount) < 0,
      rateUnit: !editingRow?.rateUnit.trim(),
      licenseValidMonth:
        !months.trim() ||
        isNaN(Number(months)) ||
        !Number.isInteger(Number(months)) ||
        Number(months) <= 0,
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
