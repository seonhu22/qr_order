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
  const [reopenEditorAfterNoticeClose, setReopenEditorAfterNoticeClose] = useState(false);
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
    setEditingRow({
      id: '',
      code: '',
      name: '',
      useYn: 'Y',
    });
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: MasterCode) => {
    setEditingRow({ ...row });
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    setEditingRow(null);
    setIsCreateMode(false);
    resetEditorErrors();
  };

  const changeEditingField = (key: 'code' | 'name' | 'useYn', value: string) => {
    setEditorErrors((prev) => ({
      ...prev,
      [key]: false,
    }));
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

    setIsEditorOpen(false);
    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!editingRow) {
      return;
    }

    try {
      await onSaveMaster(editingRow, isCreateMode);
      setIsSaveConfirmOpen(false);
      setNoticeState({
        title: '알림',
        description: '저장되었습니다.',
      });
      setEditingRow(null);
      setIsCreateMode(false);
      resetEditorErrors();
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setReopenEditorAfterNoticeClose(true);
      setNoticeState({
        title: '오류',
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
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
    }
  };

  const closeNotice = () => {
    setNoticeState(null);
    if (reopenEditorAfterNoticeClose) {
      setIsEditorOpen(true);
      setReopenEditorAfterNoticeClose(false);
    }
  };

  return {
    editingRow,
    isCreateMode,
    isCodeReadonly,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    editorErrors,
    noticeState,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    changeEditingField,
    requestSave,
    confirmSave,
    requestDelete,
    confirmDelete,
    closeSaveConfirm: () => setIsSaveConfirmOpen(false),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    closeNotice,
  };
}
