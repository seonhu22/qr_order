/**
 * @fileoverview 매장 유저 등록/수정 모달 플로우 훅
 *
 * @description
 * - 등록/수정 에디터 모달, 저장 확인 모달, 변경 내용 경고 모달의 상태와 동작을 관리한다.
 * - 삭제/비밀번호 초기화/안내 모달은 `useClientUserPage`에서 별도로 관리한다.
 */

import { useState } from 'react';
import type { ClientUser } from '../types';

export type ClientUserEditorRow = {
  id: string;
  sysId?: string;
  userId: string;
  userName: string;
  authorityCode: string;
  plantCd?: string;
};

export type ClientUserEditorErrors = {
  userId: boolean;
  userName: boolean;
  authorityCode: boolean;
};

type ClientUserNoticeInput = { title: string; description: string };

const EMPTY_ROW: ClientUserEditorRow = {
  id: '',
  userId: '',
  userName: '',
  authorityCode: '',
};

const INITIAL_ERRORS: ClientUserEditorErrors = {
  userId: false,
  userName: false,
  authorityCode: false,
};

function toEditorRow(row: ClientUser): ClientUserEditorRow {
  return {
    id: row.id,
    sysId: row.sysId,
    userId: row.userId,
    userName: row.userName,
    authorityCode: row.authorityCode,
    plantCd: row.plantCd,
  };
}

type UseClientUserModalFlowParams = {
  onSaveRow: (row: ClientUserEditorRow, isCreateMode: boolean) => Promise<void>;
  onNotice: (state: ClientUserNoticeInput) => void;
};

export function useClientUserModalFlow({ onSaveRow, onNotice }: UseClientUserModalFlowParams) {
  const [editingRow, setEditingRow] = useState<ClientUserEditorRow | null>(null);
  const [originalRow, setOriginalRow] = useState<ClientUserEditorRow | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editorErrors, setEditorErrors] = useState<ClientUserEditorErrors>(INITIAL_ERRORS);

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

  const openEditModal = (row: ClientUser) => {
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

  const changeEditingField = (key: keyof Omit<ClientUserEditorRow, 'id' | 'sysId'>, value: string) => {
    setEditorErrors((prev) => ({ ...prev, [key]: false }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const requestSave = () => {
    const nextErrors: ClientUserEditorErrors = {
      userId: !editingRow?.userId.trim(),
      userName: !editingRow?.userName.trim(),
      authorityCode: !editingRow?.authorityCode,
    };

    setEditorErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (!isCreateMode && !isDirty) {
      onNotice({ title: '알림', description: '변경된 내용이 없습니다.' });
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
      onNotice({ title: '알림', description: '저장되었습니다.' });
      setEditingRow(null);
      setOriginalRow(null);
      setIsCreateMode(false);
      resetEditorErrors();
    } catch (error) {
      setIsSaveConfirmOpen(false);
      onNotice({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    editingRow,
    isCreateMode,
    isUserIdReadonly: !isCreateMode,
    isDirty,
    editorErrors,
    isEditorOpen,
    isSaveConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    forceCloseEditorModal,
    changeEditingField,
    requestSave,
    confirmSave,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeDirtyWarning: () => setIsDirtyWarningOpen(false),
  };
}
