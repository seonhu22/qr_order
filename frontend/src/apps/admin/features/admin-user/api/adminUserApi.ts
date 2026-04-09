/**
 * @fileoverview 관리자 관리 feature의 서버 연동 계층
 */

import { useGetPlantCombo } from '@/generated/combo-controller/combo-controller';
import { useGetAdminUser } from '@/generated/settings-controller/settings-controller';
import { useSaveAdminUser } from '@/generated/settings-controller/settings-controller';
import { useInitPwd } from '@/generated/login-controller/login-controller';
import type { AdminUser } from '@/generated/types/adminUser';
import type { AdminUserRequest } from '@/generated/types/adminUserRequest';
import type { Combo } from '@/generated/types/combo';
import type { AdminUserResponse } from '@/generated/types/adminUserResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import type { SelectOption } from '@/shared/components/input';
import type { AdminUserRow } from '../types';

/**
 * 서버 관리자 DTO를 화면 목록 모델로 변환한다.
 */
export function mapToAdminUserModel(user: AdminUserResponse): AdminUserRow {
  const userId = user.userId ?? '';
  const plantCd = user.plantCd ?? '';

  return {
    id: user.sysId ?? `${userId}-${plantCd}`,
    sysId: user.sysId,
    userId,
    userName: user.userNm ?? '',
    plantCd,
    plantName: user.plantNm ?? '',
    isNew: false,
  };
}

/**
 * 화면 모델을 서버 저장 payload로 변환한다.
 */
export function mapToAdminUserPayload(user: AdminUserRow): AdminUser {
  return {
    sysId: user.sysId,
    userId: user.userId,
    userNm: user.userName,
    plantCd: user.plantCd,
  };
}

/**
 * combo 응답을 검색용 SelectInput 옵션으로 변환한다.
 */
export function mapToPlantSelectOption(combo: Combo): SelectOption {
  return {
    value: combo.code ?? '',
    label: combo.name ?? '',
  };
}

function isSameAdminUserRow(a: AdminUserRow, b: AdminUserRow) {
  return a.userId === b.userId && a.userName === b.userName && a.plantCd === b.plantCd;
}

export function buildAdminUserRequest(
  currentRows: AdminUserRow[],
  originalRows: AdminUserRow[],
): AdminUserRequest {
  const originalBySysId = new Map(
    originalRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );
  const currentBySysId = new Map(
    currentRows.filter((row) => row.sysId).map((row) => [row.sysId as string, row]),
  );

  const newItems = currentRows.filter((row) => row.isNew).map(mapToAdminUserPayload);
  const updateItems = currentRows
    .filter((row) => row.sysId && !row.isNew)
    .filter((row) => {
      const originalRow = originalBySysId.get(row.sysId as string);
      return originalRow ? !isSameAdminUserRow(row, originalRow) : false;
    })
    .map(mapToAdminUserPayload);
  const delItems = originalRows
    .filter((row) => row.sysId && !currentBySysId.has(row.sysId as string))
    .map(mapToAdminUserPayload);

  return {
    newItems: newItems.length ? newItems : undefined,
    updateItems: updateItems.length ? updateItems : undefined,
    delItems: delItems.length ? delItems : undefined,
  };
}

export function hasAdminUserChanges(request: AdminUserRequest) {
  return Boolean(request.newItems?.length || request.updateItems?.length || request.delItems?.length);
}

/**
 * 관리자 목록 조회 wrapper hook
 */
export function useAdminUserQuery(searchKeyword = '') {
  return useGetAdminUser(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.adminUser.list(searchKeyword),
    },
  });
}

export function usePlantComboOptionsQuery() {
  return useGetPlantCombo();
}

export function useSaveAdminUsersMutation() {
  const mutation = useSaveAdminUser();

  return {
    mutateAsync: async (request: AdminUserRequest) => mutation.mutateAsync({ data: request }),
    isPending: mutation.isPending,
  };
}

export function useResetAdminUserPasswordMutation() {
  const mutation = useInitPwd();

  return {
    mutateAsync: async (userId: string, password = 'SN111111') =>
      mutation.mutateAsync({
        params: { userId },
        data: { password, chkPassword: password },
      }),
    isPending: mutation.isPending,
  };
}
