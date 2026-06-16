/**
 * @fileoverview 매장 직원(클라이언트 유저) 관리 화면 모델 타입
 *
 * @remarks
 * 권한 코드(`authorityCode`)는 백엔드 공통 콤보(`USER_ROLE`)에서 동적으로 확장될 수 있으므로
 * union literal이 아닌 `string`으로 둔다. (예: 'ADMIN', 'ADMIN_OWNER', 'STAFF', 'STAFF_PART' ...)
 */

export type ClientUser = {
  id: string;
  userId: string;
  userName: string;
  authorityCode: string;
  authorityLabel: string;
};
