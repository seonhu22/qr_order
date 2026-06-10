/**
 * @fileoverview 클라이언트 유저 관리 화면 mock
 *
 * @description
 * UI 단계 mock. 실제 데이터는 백엔드 `/api/client/store_manage/user_manage/search` 와
 * 공통 콤보 `USER_ROLE` 에서 받는다. label은 콤보 응답 기반으로 갱신될 예정.
 */

import type { ClientUser } from '../types';

export const CLIENT_USER_MOCK_ROWS: ClientUser[] = [
  { id: 'admin001', userId: 'admin001', userName: '홍길동', authorityCode: 'ADMIN', authorityLabel: '관리자' },
  { id: 'manager001', userId: 'manager001', userName: '김영희', authorityCode: 'STAFF', authorityLabel: '스태프' },
  { id: 'staff001', userId: 'staff001', userName: '이철수', authorityCode: 'STAFF', authorityLabel: '스태프' },
  { id: 'staff002', userId: 'staff002', userName: '박민수', authorityCode: 'STAFF', authorityLabel: '스태프' },
  { id: 'manager002', userId: 'manager002', userName: '정수진', authorityCode: 'STAFF', authorityLabel: '스태프' },
];
