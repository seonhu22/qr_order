/**
 * @fileoverview 테이블 카드 레이아웃 컴포넌트
 *
 * @description
 * - 관리자 화면 테이블 공통 카드 구조(article > header + content)를 제공한다.
 * - 카드 내부 컨텐츠(테이블 래퍼, 로딩/빈 상태 등)는 children으로 주입한다.
 * - title이 없으면 header를 렌더링하지 않는다(빈 상태 카드에 활용).
 *
 * @example 타이틀만
 * ```tsx
 * <TableCard title="사업장 목록" ariaLabel="사업장 목록">
 *   <div className="common-table-wrap">
 *     <table className="common-table">...</table>
 *   </div>
 * </TableCard>
 * ```
 *
 * @example 타이틀 + 액션 버튼
 * ```tsx
 * <TableCard
 *   title="관리자 목록"
 *   ariaLabel="관리자 목록"
 *   actions={<><Button>행추가</Button><Button>저장</Button></>}
 * >
 *   <div className="common-table-wrap">...</div>
 * </TableCard>
 * ```
 *
 * @example title 생략 — header 없이 빈 상태만 표시
 * ```tsx
 * <TableCard ariaLabel="공통코드 상세">
 *   <FeedbackState variant="empty" className="common-code-card__empty" ... />
 * </TableCard>
 * ```
 */

import './TableCard.css';
import type { TableCardProps } from './types';

/**
 * 관리자 화면 테이블 카드 레이아웃
 */
export function TableCard({
  title,
  actions,
  actionsClassName,
  ariaLabel,
  className,
  children,
}: TableCardProps) {
  const articleClass = className ? `common-code-card ${className}` : 'common-code-card';
  const actionsClass = actionsClassName
    ? `common-code-card__actions ${actionsClassName}`
    : 'common-code-card__actions';

  return (
    <article className={articleClass} aria-label={ariaLabel}>
      {title != null && (
        <header className="common-code-card__header">
          <h2 className="common-code-card__title">{title}</h2>
          {actions != null && <div className={actionsClass}>{actions}</div>}
        </header>
      )}
      {children}
    </article>
  );
}