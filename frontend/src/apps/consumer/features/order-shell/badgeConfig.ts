import type { OrderShellMenuBadge } from './types';

/** 메뉴 카드·상세 시트가 공유하는 배지 라벨·아이콘 매핑. */
export const MENU_BADGE_CONFIG: Record<OrderShellMenuBadge, { label: string; iconId: string }> = {
  popular: { label: '인기', iconId: 'ci-flame' },
  recommended: { label: '추천', iconId: 'ci-star' },
  limited: { label: '한정수량', iconId: 'ci-zap' },
};
