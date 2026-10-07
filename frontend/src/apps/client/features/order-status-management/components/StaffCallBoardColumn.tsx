import './OrderStatusColumn.css';
import { Button } from '@/shared/components/button';
import { FeedbackState } from '@/shared/components/feedback';
import { StaffCallBoardCard } from './StaffCallBoardCard';
import type { StaffCallBoardRow } from '../types';

type StaffCallBoardColumnProps = {
  rows: StaffCallBoardRow[];
  onComplete: (id: string) => Promise<void>;
  pendingIds: Set<string>;
  errors: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

/**
 * 직원호출 컬럼 — `OrderStatusColumn`과 같은 헤더/패널 구조를 쓰지만, 카드 형태가 완전히 달라
 * (`OrderBoardRow`가 아니라 `StaffCallBoardRow`) 별도 컴포넌트로 둔다.
 */
export function StaffCallBoardColumn({
  rows,
  onComplete,
  pendingIds,
  errors,
  isLoading,
  isError,
  onRetry,
}: StaffCallBoardColumnProps) {
  return (
    <section className="order-status-column order-status-column--staffcall" aria-label="직원호출 컬럼">
      <div className="order-status-column__panel">
        <header className="order-status-column__header">
          <h2 className="order-status-column__title">직원호출</h2>
          <span className="order-status-column__count">{rows.length}</span>
        </header>

        <div className="order-status-column__list">
          {isLoading ? (
            <FeedbackState variant="loading" title="직원호출을 불러오는 중입니다." />
          ) : isError ? (
            <FeedbackState
              variant="error"
              title="직원호출을 불러오지 못했습니다."
              description="잠시 후 다시 시도해주세요."
            >
              <Button variant="outline" size="sm" onClick={onRetry}>다시 시도</Button>
            </FeedbackState>
          ) : rows.length === 0 ? (
            <p className="order-status-column__empty">직원호출이 없습니다.</p>
          ) : (
            rows.map((row) => (
              <StaffCallBoardCard
                key={row.id}
                row={row}
                onComplete={onComplete}
                isPending={pendingIds.has(row.id)}
                error={errors.get(row.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
