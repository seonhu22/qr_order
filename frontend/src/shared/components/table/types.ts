import type { ReactNode } from 'react';

export type TableCardProps = {
  /** 카드 타이틀. undefined이면 header 전체를 렌더링하지 않는다. */
  title?: string;
  /** 헤더 우측 액션 버튼 영역 */
  actions?: ReactNode;
  /** 액션 컨테이너에 추가할 CSS 클래스 (예: 'common-code-card__actions--detail') */
  actionsClassName?: string;
  /** article 요소의 aria-label */
  ariaLabel: string;
  /** article 요소에 추가할 CSS 클래스 */
  className?: string;
  /** 카드 본문 (테이블 래퍼, 로딩/빈 상태 등) */
  children: ReactNode;
};