/**
 * @fileoverview 메뉴 관리 목업 데이터
 *
 * @description
 * 실제 API 연동 전까지 사용하는 샘플 트리 데이터.
 * API 연동 후 이 파일은 제거한다.
 */

import type { MenuNode } from '../types';

export const MOCK_MENU_NODES: MenuNode[] = [
  {
    id: 'sys',
    label: 'SYS',
    data: {
      sysId: 'sys',
      code: 'SYS',
      name: '시스템 관리',
      ordNo: 1,
    },
    children: [
      {
        id: 'sys-biz',
        label: 'SYS-BIZ',
        data: {
          sysId: 'sys-biz',
          parentMenuCd: 'sys',
          code: 'SYS-BIZ',
          name: '사업장 관리',
          ordNo: 1,
        },
        children: [
          {
            id: 'sys-biz-srch',
            label: 'SYS-BIZ-SRCH',
            data: {
              sysId: 'sys-biz-srch',
              parentMenuCd: 'sys-biz',
              code: 'SYS-BIZ-SRCH',
              name: '사업장 조회',
              path: '/admin/system/plant',
              ordNo: 1,
            },
          },
          {
            id: 'sys-biz-reg',
            label: 'SYS-BIZ-REG',
            data: {
              sysId: 'sys-biz-reg',
              parentMenuCd: 'sys-biz',
              code: 'SYS-BIZ-REG',
              name: '사업장 등록',
              path: '/admin/system/plant/new',
              ordNo: 2,
            },
          },
        ],
      },
      {
        id: 'sys-adm',
        label: 'SYS-ADM',
        data: {
          sysId: 'sys-adm',
          parentMenuCd: 'sys',
          code: 'SYS-ADM',
          name: '관리자 관리',
          ordNo: 2,
        },
        children: [
          {
            id: 'sys-adm-srch',
            label: 'SYS-ADM-SRCH',
            data: {
              sysId: 'sys-adm-srch',
              parentMenuCd: 'sys-adm',
              code: 'SYS-ADM-SRCH',
              name: '관리자 조회',
              path: '/admin/system/admin-user',
              ordNo: 1,
            },
          },
        ],
      },
      {
        id: 'sys-menu',
        label: 'SYS-MENU',
        data: {
          sysId: 'sys-menu',
          parentMenuCd: 'sys',
          code: 'SYS-MENU',
          name: '메뉴 관리',
          path: '/admin/system/menu',
          ordNo: 3,
        },
      },
    ],
  },
  {
    id: 'ord',
    label: 'ORD',
    data: {
      sysId: 'ord',
      code: 'ORD',
      name: '주문 관리',
      ordNo: 2,
    },
    children: [
      {
        id: 'ord-list',
        label: 'ORD-LIST',
        data: {
          sysId: 'ord-list',
          parentMenuCd: 'ord',
          code: 'ORD-LIST',
          name: '주문 목록',
          path: '/admin/order',
          ordNo: 1,
        },
      },
    ],
  },
];

