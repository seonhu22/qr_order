/**
 * @fileoverview 공통코드 마스터 모달 흐름 상태 훅
 *
 * @description
 * - 마스터 테이블에서 사용하는 편집/저장/삭제/안내 모달 상태를 한 곳에 모은다.
 * - 테이블 컴포넌트는 UI 렌더링에 집중하고, 상태 전이는 이 훅이 담당한다.
 * - 현재는 common-code feature 전용 훅으로 유지하고, 다른 화면에서 같은 패턴이
 *   반복될 때 shared 계층 승격을 검토한다.
 */

import { useState } from 'react';
import type { MasterCode } from '../types';

type NoticeState = {
  title: string;
  description: string;
  helperText?: string;
} | null;

type UseCommonCodeMasterModalFlowParams = {
  checkedMasterIds: string[];
  onSaveMaster: (master: MasterCode, isCreateMode: boolean) => Promise<void>;
  onDeleteMasters: () => Promise<number>;
};

/**
 * 공통코드 마스터 CRUD 모달 흐름을 관리한다.
 *
 * @description
 * - 신규/수정 모달 draft
 * - 저장 확인 모달
 * - 삭제 확인 모달
 * - 기본 안내 모달
 * 을 한 흐름으로 묶는다.
 */
export function useCommonCodeMasterModalFlow({
  checkedMasterIds,
  onSaveMaster,
  onDeleteMasters,
}: UseCommonCodeMasterModalFlowParams) {
  const [editingRow, setEditingRow] = useState<MasterCode | null>(null);
  const [originalRow, setOriginalRow] = useState<MasterCode | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [editorErrors, setEditorErrors] = useState<{
    code: boolean;
    name: boolean;
    useYn: boolean;
  }>({
    code: false,
    name: false,
    useYn: false,
  });
  const [noticeState, setNoticeState] = useState<NoticeState>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirtyWarningOpen, setIsDirtyWarningOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const selectedDeleteCount = checkedMasterIds.length;
  const isCodeReadonly = !isCreateMode;

  const resetEditorErrors = () => {
    setEditorErrors({
      code: false,
      name: false,
      useYn: false,
    });
  };

  const openCreateModal = () => {
    const blank = { id: '', code: '', name: '', useYn: 'Y' };
    setEditingRow(blank);
    setOriginalRow(blank);
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: MasterCode) => {
    setEditingRow({ ...row });
    setOriginalRow({ ...row });
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    if (isDirty) {
      setIsDirtyWarningOpen(true);
      return;
    }
    forceCloseEditorModal();
  };

  const forceCloseEditorModal = () => {
    setIsDirtyWarningOpen(false);
    setIsEditorOpen(false);
    setEditingRow(null);
    setOriginalRow(null);
    setIsCreateMode(false);
    resetEditorErrors();
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
      await onSaveMaster(editingRow, isCreateMode);
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
        helperText: '삭제할 행을 선택 및 체크박스로 선택 후 진행하세요.',
      });
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmingDelete(true);
    try {
      const deletedCount = await onDeleteMasters();
      setIsDeleteConfirmOpen(false);
      setNoticeState({
        title: deletedCount > 1 ? `${deletedCount}건이 삭제되었습니다.` : '삭제되었습니다.',
        description: '삭제된 데이터는 복구할 수 없습니다.',
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

  const closeNotice = () => {
    setNoticeState(null);
  };

  const isDirty =
    editingRow !== null &&
    originalRow !== null &&
    (editingRow.code !== originalRow.code ||
      editingRow.name !== originalRow.name ||
      editingRow.useYn !== originalRow.useYn);

  return {
    editingRow,
    isCreateMode,
    isCodeReadonly,
    isDirty,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    isConfirmingDelete,
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
    closeNotice,
  };
}
