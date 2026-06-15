/**
 * @fileoverview 매장 유저 정보 관리 feature의 서버 연동 계층
 */

import {
  useDelClientUser,
  useGetClientUser,
  useResetPwd,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { ClientUserResponse } from '@/generated/types/clientUserResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { CLIENT_USER_AUTHORITY_LABELS } from '../constants';
import type { ClientUser } from '../types';

/**
 * 서버 클라이언트 유저 DTO를 화면 목록 모델로 변환한다.
 */
export function mapToClientUserModel(item: ClientUserResponse): ClientUser {
  const authorityCode = item.userRole ?? '';

  return {
    id: item.sysId ?? item.userId ?? '',
    sysId: item.sysId,
    userId: item.userId ?? '',
    userName: item.userNm ?? '',
    authorityCode,
    authorityLabel: CLIENT_USER_AUTHORITY_LABELS[authorityCode] ?? authorityCode,
  };
}

/**
 * 매장 유저 목록 조회 wrapper hook
 */
export function useClientUserQuery(searchKeyword = '') {
  return useGetClientUser(searchKeyword ? { searchKeyword } : undefined, {
    query: {
      queryKey: queryKeys.clientUser.list(searchKeyword),
      ...queryPolicies.clientCrudList,
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
