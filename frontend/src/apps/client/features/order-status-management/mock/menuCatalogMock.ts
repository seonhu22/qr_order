import type { MenuCatalogItem } from '../types';

/**
 * "주문 수정" 모달의 "메뉴 추가"에서 고를 수 있는 메뉴 카탈로그.
 * 백엔드 메뉴 카탈로그 API가 아직 없어 임시로 사용하는 mock이다.
 * 실제 menu-management/menu-option feature의 mock(제육볶음/아메리카노 등)과는 테마가 달라
 * 일부러 분리했다 — orderStatusBoardMock의 메뉴/가격과 이름·단가를 맞춰 통일감을 유지한다.
 * `category`는 Figma처럼 메뉴 추가 모달에서 "메인 메뉴"/"음료수"로 묶어 보여주는 데 쓴다.
 * `optionCategories`는 Figma "옵션 추가"(node 912:12224)처럼 single(필수 라디오)/multi(수량 선택) 카테고리를 섞어 보여주려고
 * 일부 메뉴에 "맵기 조절"(single) 카테고리를 추가했다 — 실제 메뉴와 무관하게 두 선택 방식을 모두 검증하기 위한 임시 구성이다.
 */
export const MENU_CATALOG_MOCK: MenuCatalogItem[] = [
  {
    id: 'menu-pho',
    name: '쌀국수',
    unitPrice: 11900,
    category: '메인 메뉴',
    optionCategories: [
      {
        category: '맵기 조절',
        selectionType: 'single',
        options: [
          { id: 'menu-pho-spice-normal', name: '보통', unitPrice: 0 },
          { id: 'menu-pho-spice-hot', name: '매운맛', unitPrice: 0 },
        ],
      },
      {
        category: '추가옵션',
        selectionType: 'multi',
        options: [
          { id: 'menu-pho-opt-coriander', name: '고수 추가', unitPrice: 1000 },
          { id: 'menu-pho-opt-extra', name: '곰배기', unitPrice: 2000 },
        ],
      },
    ],
  },
  { id: 'menu-pho-banhmi-set', name: '쌀국수반미세트', unitPrice: 15900, category: '메인 메뉴', optionCategories: [] },
  {
    id: 'menu-buncha',
    name: '분짜',
    unitPrice: 12900,
    category: '메인 메뉴',
    optionCategories: [
      {
        category: '추가옵션',
        selectionType: 'multi',
        options: [{ id: 'menu-buncha-opt-peanut', name: '땅콩 추가', unitPrice: 500 }],
      },
    ],
  },
  { id: 'menu-springroll', name: '월남쌈', unitPrice: 9500, category: '메인 메뉴', optionCategories: [] },
  {
    id: 'menu-banhmi',
    name: '반미',
    unitPrice: 6900,
    category: '메인 메뉴',
    optionCategories: [
      {
        category: '추가옵션',
        selectionType: 'multi',
        options: [{ id: 'menu-banhmi-opt-coriander', name: '고수 추가', unitPrice: 1000 }],
      },
    ],
  },
  { id: 'menu-coffee', name: '베트남 커피', unitPrice: 6000, category: '음료수', optionCategories: [] },
  { id: 'menu-cola', name: '콜라', unitPrice: 2900, category: '음료수', optionCategories: [] },
];
