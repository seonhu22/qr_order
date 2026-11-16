/**
 * @fileoverview 매장 유저 정보 관리 feature의 서버 연동 계층
 */

import {
  useDelClientUser,
  useGetClientUser,
  useNewClientUser,
  useResetPwd,
  useUpdateClientUser,
} from '@/generated/store-manage-controller/store-manage-controller';
import { useGetCommonCombo } from '@/generated/combo-controller/combo-controller';
import type { ClientUserRequest } from '@/generated/types/clientUserRequest';
import type { ClientUserResponse } from '@/generated/types/clientUserResponse';
import type { Combo } from '@/generated/types/combo';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { SelectOption } from '@/shared/components/input';
import { CLIENT_USER_AUTHORITY_OPTIONS, getClientUserAuthorityLabel } from '../constants';
import type { ClientUserEditorRow } from '../hooks/useClientUserModalFlow';
import type { ClientUser } from '../types';

const CLIENT_USER_AUTHORITY_COMBO_CODE = 'USER_ROLE';

/**
 * 공통코드(USER_ROLE) combo 응답을 권한 select 옵션으로 변환한다.
 */
export function mapToClientUserAuthorityOption(combo: Combo): SelectOption {
  return {
    value: combo.code ?? '',
    label: combo.name ?? '',
  };
}

/**
 * combo 응답이 비어있으면(로딩 중, 미등록 등) 하드코딩 fallback을 사용한다.
 */
export function getClientUserAuthorityOptionsWithFallback(combos: Combo[] | undefined): SelectOption[] {
  const options = (combos ?? [])
    .map(mapToClientUserAuthorityOption)
    .filter((option) => option.value && option.label);

  return options.length ? options : CLIENT_USER_AUTHORITY_OPTIONS;
}

function resolveAuthorityLabel(authorityCode: string, authorityOptions: SelectOption[]) {
  return (
    authorityOptions.find((option) => option.value === authorityCode)?.label ??
    getClientUserAuthorityLabel(authorityCode)
  );
}

/**
 * 서버 클라이언트 유저 DTO를 화면 목록 모델로 변환한다.
 */
export function mapToClientUserModel(
  item: ClientUserResponse,
  authorityOptions: SelectOption[] = CLIENT_USER_AUTHORITY_OPTIONS,
): ClientUser {
  const authorityCode = item.userRole ?? '';

  return {
    id: item.sysId ?? item.userId ?? '',
    sysId: item.sysId,
    userId: item.userId ?? '',
    userName: item.userNm ?? '',
    authorityCode,
    authorityLabel: resolveAuthorityLabel(authorityCode, authorityOptions),
    plantCd: item.plantCd,
  };
}

/**
 * 유저 권한(USER_ROLE) 공통코드 combo 조회 wrapper hook
 */
export function useClientUserAuthorityComboQuery(enabled = true) {
  return useGetCommonCombo({ code: CLIENT_USER_AUTHORITY_COMBO_CODE }, { query: { enabled } });
}

/**
 * 매장 유저 목록 조회 wrapper hook
 */
export function useClientUserQuery(
  searchKeyword = '',
  enabled = true,
  scope?: { userId: string; sysPlantCd: string },
) {
  const hasScope = Boolean(scope?.userId.trim() && scope?.sysPlantCd.trim());
  return useGetClientUser(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: [...queryKeys.clientUser.list(searchKeyword), scope?.userId ?? null, scope?.sysPlantCd ?? null],
      ...queryPolicies.clientCrudList,
      enabled: enabled && hasScope,
    },
  });
}

export function useResetClientUserPasswordMutation() {
  const mutation = useResetPwd();

  return {
    mutateAsync: async (sysId: string) => mutation.mutateAsync({ sysId }),
    isPending: mutation.isPending,
  };
}

export function useDeleteClientUsersMutation() {
  const mutation = useDelClientUser();

  return {
    mutateAsync: async (rows: ClientUser[]) =>
      mutation.mutateAsync({ data: rows.map((row) => ({ sysId: row.sysId })) }),
    isPending: mutation.isPending,
  };
}

function mapToClientUserRequest(row: ClientUserEditorRow, isCreateMode: boolean): ClientUserRequest {
  if (row.authorityCode !== '02') throw new Error('스태프만 등록하거나 수정할 수 있습니다.');
  return isCreateMode
    ? { userId: row.userId, userNm: row.userName, userRole: '02' }
    : { sysId: row.sysId, userNm: row.userName };
}

export function useSaveClientUserMutation() {
  const createMutation = useNewClientUser();
  const updateMutation = useUpdateClientUser();

  return {
    mutateAsync: async (row: ClientUserEditorRow, isCreateMode: boolean) => {
      const data = mapToClientUserRequest(row, isCreateMode);
      return isCreateMode ? createMutation.mutateAsync({ data }) : updateMutation.mutateAsync({ data });
    },
    isPending: createMutation.isPending || updateMutation.isPending,
  };
}
