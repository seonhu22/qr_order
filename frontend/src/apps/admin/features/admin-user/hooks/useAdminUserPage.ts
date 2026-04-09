/**
 * @fileoverview 관리자 관리 페이지 상태 조합 훅
 */

import { startTransition, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  buildAdminUserRequest,
  hasAdminUserChanges,
  mapToAdminUserModel,
  mapToPlantSelectOption,
  useAdminUserQuery,
  usePlantComboOptionsQuery,
  useResetAdminUserPasswordMutation,
  useSaveAdminUsersMutation,
} from '../api/adminUserApi';
import type { AdminUserRow } from '../types';

type SimpleModalState = {
  description: string;
  helperText?: string;
  onConfirm?: () => void | Promise<void>;
} | null;

type WrapperModalState = {
  title: string;
  description: string;
} | null;

type RowErrors = Record<string, { userId: boolean; userName: boolean; plantCd: boolean }>;

/**
 * 관리자 관리 화면 상태/액션 조합
 */
export function useAdminUserPage() {
  const queryClient = useQueryClient();
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [draftRows, setDraftRows] = useState<AdminUserRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<RowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');
  const [simpleModalState, setSimpleModalState] = useState<SimpleModalState>(null);
  const [wrapperModalState, setWrapperModalState] = useState<WrapperModalState>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const userQuery = useAdminUserQuery(appliedKeyword.trim());
  const plantComboQuery = usePlantComboOptionsQuery();
  const saveUsersMutation = useSaveAdminUsersMutation();
  const resetPasswordMutation = useResetAdminUserPasswordMutation();

  const plantOptions = useMemo(
    () => (plantComboQuery.data ?? []).map(mapToPlantSelectOption),
    [plantComboQuery.data],
  );

  const baseRows = useMemo(
    () => (userQuery.data ?? []).map(mapToAdminUserModel),
    [userQuery.data],
  );
  const rows = draftRows ?? baseRows;
  const normalizedSelectedRowId = rows.some((row) => row.id === selectedRowId) ? selectedRowId : '';

  const isDirty = useMemo(() => {
    const request = buildAdminUserRequest(rows, baseRows);
    return hasAdminUserChanges(request);
  }, [rows, baseRows]);

  const updateRows = (updater: (rows: AdminUserRow[]) => AdminUserRow[]) => {
    setDraftRows((prev) => updater(prev ?? baseRows));
  };

  const clearRowError = (rowId: string, key: 'userId' | 'userName' | 'plantCd') => {
    setRowErrors((prev) => ({
      ...prev,
      [rowId]: {
        userId: key === 'userId' ? false : prev[rowId]?.userId ?? false,
        userName: key === 'userName' ? false : prev[rowId]?.userName ?? false,
        plantCd: key === 'plantCd' ? false : prev[rowId]?.plantCd ?? false,
      },
    }));
  };

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  const handleSearch = () => {
    if (isDirty) {
      setSimpleModalState({
        description: '조회하시겠습니까?',
        helperText: '저장되지 않은 내용이 있습니다.',
        onConfirm: () => {
          startTransition(() => {
            setAppliedKeyword(draftKeyword);
          });
          setDraftRows(null);
          setSelectedRowId('');
          setSimpleModalState(null);
        },
      });
      return;
    }

    startTransition(() => {
      setAppliedKeyword(draftKeyword);
    });
    setDraftRows(null);
    setSelectedRowId('');
  };

  const handleReset = () => {
    startTransition(() => {
      setDraftKeyword('');
      setAppliedKeyword('');
    });
    setDraftRows(null);
    setSelectedRowId('');
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const handleChangeRowField = (rowId: string, key: 'userId' | 'userName', value: string) => {
    clearRowError(rowId, key);
    updateRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const handleChangeRowPlant = (rowId: string, plantCd: string) => {
    const matchedOption = plantOptions.find((option) => option.value === plantCd);
    clearRowError(rowId, 'plantCd');

    updateRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              plantCd,
              plantName: matchedOption?.label ?? '',
            }
          : row,
      ),
    );
  };

  const handleAddRow = () => {
    const newRow: AdminUserRow = {
      id: `new-${Date.now()}`,
      userId: '',
      userName: '',
      plantCd: '',
      plantName: '',
      isNew: true,
    };

    updateRows((prev) => [...prev, newRow]);
    setSelectedRowId(newRow.id);
  };

  const handleDeleteRow = () => {
    if (!normalizedSelectedRowId) {
      setSimpleModalState({
        description: '항목을 먼저 선택해주세요.',
        helperText: '삭제할 행을 클릭 후 진행하세요.',
      });
      return;
    }

    updateRows((prev) => prev.filter((row) => row.id !== normalizedSelectedRowId));
    setSelectedRowId('');
  };

  const nextRowErrors = rows.reduce<RowErrors>((acc, row) => {
    acc[row.id] = {
      userId: !row.userId.trim(),
      userName: !row.userName.trim(),
      plantCd: !row.plantCd.trim(),
    };
    return acc;
  }, {});

  const hasMissingRequired = Object.values(nextRowErrors).some(
    (rowError) => rowError.userId || rowError.userName || rowError.plantCd,
  );

  const handleSave = () => {
    if (hasMissingRequired) {
      setRowErrors(nextRowErrors);
      setWrapperModalState({
        title: '안내',
        description: '필수 항목을 모두 입력해주세요.',
      });
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    const request = buildAdminUserRequest(rows, baseRows);

    if (!hasAdminUserChanges(request)) {
      setIsSaveConfirmOpen(false);
      setSimpleModalState({
        description: '변경된 내용이 없습니다.',
      });
      return;
    }

    try {
      await saveUsersMutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminUser.list(appliedKeyword.trim()),
      });
      setDraftRows(null);
      setIsSaveConfirmOpen(false);
      setSimpleModalState({
        description: '저장되었습니다.',
        helperText: '초기 비밀번호는 SN111111 입니다.',
      });
    } catch (error) {
      setIsSaveConfirmOpen(false);
      setSimpleModalState({
        description: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      });
    }
  };

  const openPasswordResetConfirm = (userId: string) => {
    setSimpleModalState({
      description: '초기화하겠습니까?',
      helperText: '비밀번호가 초기화됩니다.',
      onConfirm: async () => {
        if (!userId) {
          setSimpleModalState({
            description: '초기화할 사용자 아이디가 없습니다.',
          });
          return;
        }

        try {
          await resetPasswordMutation.mutateAsync(userId);
          setSimpleModalState({
            description: '저장되었습니다.',
            helperText: '초기 비밀번호는 SN111111 입니다.',
          });
        } catch (error) {
          setSimpleModalState({
            description:
              error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.',
          });
        }
      },
    });
  };

  const handleResetPassword = (userId: string) => {
    if (isDirty) {
      setSimpleModalState({
        description: '초기화하겠습니까?',
        helperText: '저장되지 않은 내용이 있습니다.',
        onConfirm: async () => {
          if (!userId) {
            setSimpleModalState({
              description: '초기화할 사용자 아이디가 없습니다.',
            });
            return;
          }

          try {
            await resetPasswordMutation.mutateAsync(userId);
            setSimpleModalState({
              description: '저장되었습니다.',
              helperText: '초기 비밀번호는 SN111111 입니다.',
            });
          } catch (error) {
            setSimpleModalState({
              description:
                error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.',
            });
          }
        },
      });
      return;
    }

    openPasswordResetConfirm(userId);
  };

  return {
    data: {
      rows,
      plantOptions,
      rowErrors,
    },
    status: {
      isLoading: userQuery.isLoading,
      isFetching: userQuery.isFetching,
      isError: userQuery.isError,
      error: userQuery.error,
      isSaving: saveUsersMutation.isPending,
      isResettingPassword: resetPasswordMutation.isPending,
    },
    actions: {
      handleKeywordChange,
      handleSearch,
      handleReset,
      handleSelectRow,
      handleChangeRowField,
      handleChangeRowPlant,
      handleAddRow,
      handleDeleteRow,
      handleSave,
      confirmSave,
      handleResetPassword,
      closeSimpleModal: () => setSimpleModalState(null),
      closeWrapperModal: () => setWrapperModalState(null),
      closeSaveConfirm: () => setIsSaveConfirmOpen(false),
      confirmSimpleModal: async () => {
        await simpleModalState?.onConfirm?.();
      },
    },
    uiProps: {
      draftKeyword,
      appliedKeyword,
      selectedRowId: normalizedSelectedRowId,
      isDirty,
      simpleModalState,
      wrapperModalState,
      isSaveConfirmOpen,
    },
  };
}
