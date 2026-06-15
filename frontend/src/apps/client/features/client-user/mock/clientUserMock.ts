/**
 * @fileoverview 클라이언트 유저 관리 화면 mock
 *
 * @description
 * `/api/client/store_manage/user_manage/search` 응답(`ClientUserResponse[]`) 형태의 mock 데이터.
 */

import type { ClientUserResponse } from '@/generated/types/clientUserResponse';

export const CLIENT_USER_MOCK_ROWS: ClientUserResponse[] = [
  { sysId: 'admin001', userId: 'admin001', userNm: '홍길동', userRole: 'ADMIN', plantCd: 'P001', plantNm: '강남점' },
  { sysId: 'manager001', userId: 'manager001', userNm: '김영희', userRole: 'STAFF', plantCd: 'P001', plantNm: '강남점' },
  { sysId: 'staff001', userId: 'staff001', userNm: '이철수', userRole: 'STAFF', plantCd: 'P001', plantNm: '강남점' },
  { sysId: 'staff002', userId: 'staff002', userNm: '박민수', userRole: 'STAFF', plantCd: 'P001', plantNm: '강남점' },
  { sysId: 'manager002', userId: 'manager002', userNm: '정수진', userRole: 'STAFF', plantCd: 'P001', plantNm: '강남점' },
];
