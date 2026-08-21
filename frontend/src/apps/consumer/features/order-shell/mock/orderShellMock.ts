import type { OrderShellMenuItem } from '../types';

/**
 * 껍데기 단계에서 긴 메뉴 목록의 스크롤·카테고리 이동·장바구니 바를 눈으로 확인하기 위한 mock 데이터.
 * 2단계에서 실제 메뉴 API 연동 시 이 파일과 이 파일을 참조하는 훅의 mock 분기를 통째로 걷어낸다.
 *
 * 이미지 URL은 참고 저장소(Qrorder)의 같은 이름 메뉴가 실제로 쓰던 Unsplash 사진을 그대로 재사용한다.
 * 이름이 겹치지 않는 항목은 검증 안 된 URL을 새로 추측해 넣지 않고 아이콘 fallback으로 둔다.
 */
export const ORDER_SHELL_CATEGORIES = ['전체', '한식', '음료', '디저트'] as const;

export const ORDER_SHELL_MENU_ITEMS: OrderShellMenuItem[] = [
  {
    id: 'menu-1',
    name: '불고기 정식',
    category: '한식',
    price: 12000,
    description: '특제 양념 불고기와 밥, 국, 반찬 구성',
    imageUrl:
      'https://images.unsplash.com/photo-1708388463872-1be875a0ba6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    badges: ['popular', 'recommended'],
  },
  {
    id: 'menu-2',
    name: '김치찌개',
    category: '한식',
    price: 8000,
    description: '묵은지로 끓인 얼큰한 찌개, 공기밥 포함',
    imageUrl:
      'https://images.unsplash.com/photo-1676686997059-fb817ebbb2b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    badges: ['popular'],
  },
  {
    id: 'menu-3',
    name: '된장찌개',
    category: '한식',
    price: 8000,
    description: '구수한 재래식 된장찌개, 공기밥 포함',
    imageUrl:
      'https://images.unsplash.com/photo-1535923054316-5f75572def8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 'menu-4',
    name: '비빔밥',
    category: '한식',
    price: 9000,
    description: '고소한 참기름 향의 돌솥 비빔밥',
    imageUrl:
      'https://images.unsplash.com/photo-1741295017668-c8132acd6fc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    badges: ['recommended', 'limited'],
  },
  {
    id: 'menu-5',
    name: '제육볶음',
    category: '한식',
    price: 11000,
    description: '매콤달콤한 양념의 제육볶음 정식',
    imageUrl:
      'https://images.unsplash.com/photo-1708388064278-707e85eaddc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    badges: ['limited'],
  },
  {
    id: 'menu-6',
    name: '돈까스 정식',
    category: '한식',
    price: 13000,
    description: '바삭한 등심 돈까스와 공기밥, 된장국',
    imageUrl:
      'https://images.unsplash.com/photo-1615361200141-f45040f367be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    badges: ['recommended'],
  },
  {
    id: 'menu-7',
    name: '냉면',
    category: '한식',
    price: 9500,
    soldOut: true,
    description: '시원한 육수의 물냉면',
  },
  {
    id: 'menu-8',
    name: '레몬에이드',
    category: '음료',
    price: 4500,
    description: '신선한 레몬으로 만든 상큼한 에이드',
    imageUrl:
      'https://images.unsplash.com/photo-1739138056344-3c852f4efc28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 'menu-9',
    name: '아이스 아메리카노',
    category: '음료',
    price: 3500,
    description: '깔끔한 원두 향의 아이스 아메리카노',
  },
  {
    id: 'menu-10',
    name: '자몽 허니블랙티',
    category: '음료',
    price: 4800,
    description: '상큼한 자몽과 홍차의 조화',
  },
  {
    id: 'menu-11',
    name: '티라미수',
    category: '디저트',
    price: 5500,
    description: '마스카포네 치즈와 에스프레소의 조화',
    imageUrl:
      'https://images.unsplash.com/photo-1761275710704-ec6a97c0141f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 'menu-12',
    name: '치즈케이크',
    category: '디저트',
    price: 5000,
    description: '진한 크림치즈로 만든 부드러운 케이크',
  },
];
