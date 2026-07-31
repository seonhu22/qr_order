/**
 * @fileoverview 옵션 관리 화면 mock
 *
 * @description
 * 옵션 관리 랜딩 목록은 `/api/client/menu_manage/menu/detail/search?searchKeyword=...`로
 * 로그인 사용자의 사업장 메뉴를 한 번에 조회한다.
 * `/api/client/menu_manage/option/group/search/:masterSysId`(`MenuOptionGroupResponse[]`),
 * `/api/client/menu_manage/option/detail/search/:groupSysId`(`MenuOptionDetailResponse[]`) 응답 형태의 mock 데이터.
 */

import type { MenuOptionDetailResponse } from '@/generated/types/menuOptionDetailResponse';
import type { MenuOptionGroupResponse } from '@/generated/types/menuOptionGroupResponse';

export const MENU_OPTION_GROUP_MOCK_ROWS: MenuOptionGroupResponse[] = [
  {
    sysId: 'option-group-1',
    linkSysId: 'menu-3',
    groupName: '사이즈 선택',
    requiredYn: 'Y',
    inputType: '주문 옵션',
    ordNo: 1,
  },
  {
    sysId: 'option-group-2',
    linkSysId: 'menu-3',
    groupName: '샷 추가',
    requiredYn: 'N',
    inputType: '수량 설정',
    ordNo: 2,
  },
  {
    sysId: 'option-group-3',
    linkSysId: 'menu-4',
    groupName: '우유 선택',
    requiredYn: 'Y',
    inputType: '주문 옵션',
    ordNo: 1,
  },
];

export const MENU_OPTION_DETAIL_MOCK_ROWS: MenuOptionDetailResponse[] = [
  {
    sysId: 'option-detail-1',
    linkSysId: 'option-group-1',
    menuOptionName: '톨',
    menuOptionPrice: '0',
    useYn: 'Y',
    ordNo: 1,
  },
  {
    sysId: 'option-detail-2',
    linkSysId: 'option-group-1',
    menuOptionName: '그란데',
    menuOptionPrice: '500',
    useYn: 'Y',
    ordNo: 2,
  },
  {
    sysId: 'option-detail-3',
    linkSysId: 'option-group-2',
    menuOptionName: '샷 추가',
    menuOptionPrice: '500',
    maximumNum: '3',
    useYn: 'Y',
    ordNo: 1,
  },
  {
    sysId: 'option-detail-4',
    linkSysId: 'option-group-3',
    menuOptionName: '일반 우유',
    menuOptionPrice: '0',
    useYn: 'Y',
    ordNo: 1,
  },
  {
    sysId: 'option-detail-5',
    linkSysId: 'option-group-3',
    menuOptionName: '두유',
    menuOptionPrice: '500',
    useYn: 'Y',
    ordNo: 2,
  },
];
