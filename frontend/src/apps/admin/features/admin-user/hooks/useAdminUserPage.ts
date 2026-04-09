/**
 * @fileoverview 관리자 관리 페이지 상태 조합 훅
 *
 * @description
 * - query 결과를 화면 모델로 변환한다.
 * - 목록 편집 상태(useAdminUserListState)와 공통 flow(useAdminUserFlow)를 조합한다.
 * - 페이지 컴포넌트는 이 훅의 반환값을 그대로 조립만 하도록 만드는 것이 목표다.
 */

import { useMemo, useState } from 'react';
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
import { useAdminUserListState } from './useAdminUserListState';
import { useAdminUserFlow } from './useAdminUserFlow';
import type { AdminUserPageViewModel } from '../types';

/**
 * 관리자 관리 화면 상태/액션 조합
 *
 * @returns
 * `data / status / actions / uiProps` 형태의 뷰모델.
 *
 * @remarks
 * - `data`: 렌더링에 필요한 화면 데이터
 * - `status`: query / mutation 진행 상태
 * - `actions`: 이벤트 핸들러
 * - `uiProps`: 화면 전용 상태(draft keyword, selected row, flow state)
 */
export function useAdminUserPage(): AdminUserPageViewModel {
  const queryClient = useQueryClient();
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const userQuery = useAdminUserQuery(appliedKeyword.trim());
  const plantComboQuery = usePlantComboOptionsQuery();
  const saveUsersMutation = useSaveAdminUsersMutation();
  const resetPasswordMutation = useResetAdminUserPasswordMutation();

  /**
   * 사업장 combo API 응답을 searchable select가 바로 사용할 수 있는 옵션으로 변환한다.
   */
  const plantOptions = useMemo(
    () => (plantComboQuery.data ?? []).map(mapToPlantSelectOption),
    [plantComboQuery.data],
  );

  /**
   * 관리자 조회 DTO를 화면용 row 모델로 변환한다.
   *
   * @remarks
   * 이후 편집은 baseRows를 직접 수정하지 않고 useAdminUserListState의 draftRows에서 관리한다.
   */
  const baseRows = useMemo(
    () => (userQuery.data ?? []).map(mapToAdminUserModel),
    [userQuery.data],
  );
  const {
    rows,
    rowErrors,
    selectedRowId,
    isDirty,
    selectRow,
    changeRowField,
    changeRowPlant,
    addRow,
    deleteSelectedRow,
    validateRequiredFields,
    resetToBaseRows,
  } = useAdminUserListState({
    baseRows,
    plantOptions,
  });

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  /**
   * 현재 rows를 기준으로 저장 request를 만들고 mutation을 실행한다.
   *
   * @returns
   * - `saved`: 실제 저장이 발생한 경우
   * - `unchanged`: diff가 없어 저장할 내용이 없는 경우
   */
  const saveChanges = async (): Promise<'saved' | 'unchanged'> => {
    const request = buildAdminUserRequest(rows, baseRows);

    if (!hasAdminUserChanges(request)) {
      return 'unchanged';
    }

    await saveUsersMutation.mutateAsync(request);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.adminUser.list(appliedKeyword.trim()),
    });
    resetToBaseRows();
    return 'saved';
  };

  const flow = useAdminUserFlow({
    draftKeyword,
    isDirty,
    selectedRowId,
    onApplySearch: (keyword) => setAppliedKeyword(keyword),
    onResetFilters: () => {
      setDraftKeyword('');
      setAppliedKeyword('');
    },
    onResetDraftRows: resetToBaseRows,
    onDeleteSelectedRow: deleteSelectedRow,
    onValidateRequiredFields: validateRequiredFields,
    onSaveChanges: saveChanges,
    onResetPassword: async (userId) => {
      await resetPasswordMutation.mutateAsync(userId);
    },
  });

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
      handleSearch: flow.requestSearch,
      handleReset: flow.requestResetFilters,
      handleSelectRow: selectRow,
      handleChangeRowField: changeRowField,
      handleChangeRowPlant: changeRowPlant,
      handleAddRow: addRow,
      handleDeleteRow: flow.requestDeleteRow,
      handleSave: flow.requestSave,
      confirmSave: flow.confirmSave,
      handleResetPassword: flow.requestResetPassword,
      closeSimpleModal: flow.closeSimpleModal,
      closeWrapperModal: flow.closeWrapperModal,
      closeSaveConfirm: flow.closeSaveConfirm,
      confirmSimpleModal: flow.confirmSimpleModal,
    },
    uiProps: {
      draftKeyword,
      appliedKeyword,
      selectedRowId,
      isDirty,
      flowState: flow.state,
    },
  };
}
