/**
 * @fileoverview 메뉴 관리 화면 mock
 *
 * @description
 * `/api/client/menu_manage/menu/master/search`(`MenuMasterResponse[]`),
 * `/api/client/menu_manage/menu/detail/search/:masterSysId`(`MenuDetailResponse[]`) 응답 형태의 mock 데이터.
 */

import type { MenuDetailResponse } from '@/generated/types/menuDetailResponse';
import type { MenuMasterResponse } from '@/generated/types/menuMasterResponse';

export const MENU_CATEGORY_MOCK_ROWS: MenuMasterResponse[] = [
  { sysId: 'category-1', categoryName: '식사', useYn: 'Y', ordNo: 1 },
  { sysId: 'category-2', categoryName: '음료', useYn: 'Y', ordNo: 2 },
  { sysId: 'category-3', categoryName: '디저트', useYn: 'N', ordNo: 3 },
];

export const MENU_DETAIL_MOCK_ROWS: MenuDetailResponse[] = [
  { sysId: 'menu-1', linkSysId: 'category-1', menuName: '제육볶음', menuPrice: 9000, optionUseYn: 'N', useYn: 'Y', ordNo: 1 },
  { sysId: 'menu-2', linkSysId: 'category-1', menuName: '된장찌개', menuPrice: 8000, optionUseYn: 'N', useYn: 'Y', ordNo: 2 },
  { sysId: 'menu-3', linkSysId: 'category-2', menuName: '아메리카노', menuPrice: 4000, optionUseYn: 'Y', useYn: 'Y', ordNo: 1 },
  { sysId: 'menu-4', linkSysId: 'category-2', menuName: '카페라떼', menuPrice: 4500, optionUseYn: 'Y', useYn: 'Y', ordNo: 2 },
];
