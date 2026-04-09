/**
 * @fileoverview 관리자 관리 feature의 서버 연동 계층
 */

import { useGetAdminUser } from '@/generated/settings-controller/settings-controller';
import type { AdminUserResponse } from '@/generated/types/adminUserResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import type { AdminUserRow } from '../types';

/**
 * 서버 관리자 DTO를 화면 목록 모델로 변환한다.
 */
export function mapToAdminUserModel(user: AdminUserResponse): AdminUserRow {
  const userId = user.userId ?? '-';
  const plantCd = user.plantCd ?? '-';

  return {
    id: user.sysId ?? `${userId}-${plantCd}`,
    userId,
    userName: user.userNm ?? '-',
    plantName: user.plantNm ?? '-',
  };
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
