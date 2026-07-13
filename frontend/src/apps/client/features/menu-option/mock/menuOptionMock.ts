/**
 * @fileoverview 옵션 관리 화면 mock
 *
 * @description
 * 옵션 관리 랜딩 목록은 `/api/client/menu_manage/menu/master/search`와
 * `/api/client/menu_manage/menu/detail/search/:masterSysId` mock을 조합해 메뉴명 기준으로 만든다.
 * `/api/client/menu_manage/option/group/search/:masterSysId`(`MenuOptionGroupResponse[]`),
 * `/api/client/menu_manage/option/detail/search/:groupSysId`(`MenuOptionDetailResponse[]`) 응답 형태의 mock 데이터.
 */

import type { MenuOptionDetailResponse } from '@/generated/types/menuOptionDetailResponse';
import type { MenuOptionGroupResponse } from '@/generated/types/menuOptionGroupResponse';
import type { MenuOptionMasterResponse } from '@/generated/types/menuOptionMasterResponse';

export const MENU_OPTION_MASTER_MOCK_ROWS: MenuOptionMasterResponse[] = [
  { sysId: 'option-master-1', categoryName: '아메리카노', useYn: 'Y', ordNo: 1 },
  { sysId: 'option-master-2', categoryName: '카페라떼', useYn: 'Y', ordNo: 2 },
];

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
];
