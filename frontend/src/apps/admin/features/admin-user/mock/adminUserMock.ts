import type { AdminUserResponse } from '@/generated/types/adminUserResponse';

export const ADMIN_USER_MOCK_ROWS: AdminUserResponse[] = [
  { sysId: 'admin-001', userId: 'kim.admin',  userNm: '김관리자', plantCd: 'ADMIN', plantNm: '시스템 관리' },
  { sysId: 'admin-002', userId: 'lee.admin',  userNm: '이운영자', plantCd: 'ADMIN', plantNm: '시스템 관리' },
  { sysId: 'admin-003', userId: 'park.admin', userNm: '박관리자', plantCd: 'ADMIN', plantNm: '시스템 관리' },
];
