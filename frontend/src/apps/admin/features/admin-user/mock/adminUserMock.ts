import type { AdminUserResponse } from '@/generated/types/adminUserResponse';

export const ADMIN_USER_MOCK_ROWS: AdminUserResponse[] = [
  { sysId: 'admin-001', userId: 'kim.admin',  userNm: '김관리자', plantCd: 'PLT-001', plantNm: '강남 1호점' },
  { sysId: 'admin-002', userId: 'lee.admin',  userNm: '이운영자', plantCd: 'PLT-002', plantNm: '홍대 2호점' },
  { sysId: 'admin-003', userId: 'park.admin', userNm: '박관리자', plantCd: 'PLT-003', plantNm: '신촌 3호점' },
];
