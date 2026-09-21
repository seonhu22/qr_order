import './OrderStatusColumn.css';
import { StaffCallBoardCard } from './StaffCallBoardCard';
import type { StaffCallBoardRow } from '../types';

type StaffCallBoardColumnProps = {
  rows: StaffCallBoardRow[];
  onComplete: (id: string) => void;
};

/**
 * 직원호출 컬럼 — `OrderStatusColumn`과 같은 헤더/패널 구조를 쓰지만, 카드 형태가 완전히 달라
 * (`OrderBoardRow`가 아니라 `StaffCallBoardRow`) 별도 컴포넌트로 둔다.
 */
export function StaffCallBoardColumn({ rows, onComplete }: StaffCallBoardColumnProps) {
  return (
    <section className="order-status-column order-status-column--staffcall" aria-label="직원호출 컬럼">
      <div className="order-status-column__panel">
        <header className="order-status-column__header">
          <h2 className="order-status-column__title">직원호출</h2>
          <span className="order-status-column__count">{rows.length}</span>
        </header>

        <div className="order-status-column__list">
          {rows.length === 0 ? (
            <p className="order-status-column__empty">직원호출이 없습니다.</p>
          ) : (
            rows.map((row) => (
              <StaffCallBoardCard key={row.id} row={row} onComplete={onComplete} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
