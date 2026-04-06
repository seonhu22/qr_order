/**
 * @fileoverview 관리자 관리 페이지 상태 조합 훅
 */

import { startTransition, useMemo, useState } from 'react';
import { mapToAdminUserModel, useAdminUserQuery } from '../api/adminUserApi';

/**
 * 관리자 관리 화면 상태/액션 조합
 */
export function useAdminUserPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const userQuery = useAdminUserQuery(appliedKeyword.trim());

  const rows = useMemo(() => (userQuery.data ?? []).map(mapToAdminUserModel), [userQuery.data]);

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  const handleSearch = () => {
    startTransition(() => {
      setAppliedKeyword(draftKeyword);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setDraftKeyword('');
      setAppliedKeyword('');
    });
  };

  const handleAddRow = () => {};
  const handleDeleteRow = () => {};
  const handleSave = () => {};
  const handleResetPassword = () => {};

  return {
    data: {
      rows,
    },
    status: {
      isLoading: userQuery.isLoading,
      isFetching: userQuery.isFetching,
      isError: userQuery.isError,
      error: userQuery.error,
    },
    actions: {
      handleKeywordChange,
      handleSearch,
      handleReset,
      handleAddRow,
      handleDeleteRow,
      handleSave,
      handleResetPassword,
    },
    uiProps: {
      draftKeyword,
      appliedKeyword,
    },
  };
}
