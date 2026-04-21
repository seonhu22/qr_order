import type { SysAccessLogDetail } from '@/generated/types/sysAccessLogDetail';
import type { SysAccessLogMaster } from '@/generated/types/sysAccessLogMaster';

export const ACCESS_LOG_MASTER_MOCK: SysAccessLogMaster[] = [
  {
    sysId: 'log-001',
    userId: 'admin001',
    userNm: '홍길동',
    ipAddress: '192.168.1.100',
    loginDatetime: '2026-04-14T09:15:32',
    logoutDatetime: '2026-04-14T18:30:45',
  },
  {
    sysId: 'log-002',
    userId: 'manager001',
    userNm: '김영희',
    ipAddress: '192.168.1.101',
    loginDatetime: '2026-04-15T08:45:12',
    logoutDatetime: '2026-04-15T17:50:23',
  },
  {
    sysId: 'log-003',
    userId: 'staff001',
    userNm: '이철수',
    ipAddress: '192.168.1.102',
    loginDatetime: '2026-04-16T10:20:55',
    logoutDatetime: '2026-04-16T19:10:08',
  },
  {
    sysId: 'log-004',
    userId: 'admin002',
    userNm: '박민수',
    ipAddress: '192.168.1.103',
    loginDatetime: '2026-04-17T09:00:00',
    logoutDatetime: '2026-04-17T18:00:00',
  },
  {
    sysId: 'log-005',
    userId: 'staff002',
    userNm: '최지은',
    ipAddress: '192.168.1.104',
    loginDatetime: '2026-04-18T11:30:22',
    logoutDatetime: '2026-04-18T20:15:33',
  },
];

export const ACCESS_LOG_DETAIL_MOCK: (SysAccessLogDetail & { menuNm: string })[] = [
  {
    menuCd: 'SYS001',
    menuNm: '시스템 관리',
    menuOpenDatetime: '2026-04-14T09:16:00',
    menuCloseDatetime: '2026-04-14T09:25:30',
  },
  {
    menuCd: 'USR001',
    menuNm: '사용자 관리',
    menuOpenDatetime: '2026-04-14T09:26:00',
    menuCloseDatetime: '2026-04-14T10:15:22',
  },
  {
    menuCd: 'MENU001',
    menuNm: '메뉴 관리',
    menuOpenDatetime: '2026-04-14T10:16:00',
    menuCloseDatetime: '2026-04-14T11:30:45',
  },
  {
    menuCd: 'CODE001',
    menuNm: '공통코드 관리',
    menuOpenDatetime: '2026-04-14T11:31:00',
    menuCloseDatetime: '2026-04-14T12:00:00',
  },
];