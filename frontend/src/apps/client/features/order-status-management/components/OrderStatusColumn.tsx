import './OrderStatusColumn.css';
import { OrderStatusCard } from './OrderStatusCard';
import { useExitAnimatedRows } from '../hooks/useExitAnimatedRows';
import type { OrderBoardCardActions, OrderBoardColumnData } from '../types';

type OrderStatusColumnProps = {
  column: OrderBoardColumnData;
  actions: OrderBoardCardActions;
  lastMovedIds: string[];
  pendingOrderIds: Set<string>;
  mutationErrors: Map<string, string>;
};

export function OrderStatusColumn({ column, actions, lastMovedIds, pendingOrderIds, mutationErrors }: OrderStatusColumnProps) {
  const { renderedRows, handleExited } = useExitAnimatedRows(column.rows);

  return (
    <section
      className={`order-status-column order-status-column--${column.status.toLowerCase()}`}
      aria-label={`${column.label} 컬럼`}
    >
      <div className="order-status-column__panel">
        <header className="order-status-column__header">
          <h2 className="order-status-column__title">{column.label}</h2>
          <span className="order-status-column__count">{column.rows.length}</span>
        </header>

        <div className="order-status-column__list">
          {renderedRows.length === 0 ? (
            <p className="order-status-column__empty">주문이 없습니다.</p>
          ) : (
            renderedRows.map(({ row, isLeaving }) => (
              <OrderStatusCard
                key={row.id}
                row={row}
                actions={actions}
                isMoved={lastMovedIds.includes(row.id)}
                isPending={pendingOrderIds.has(row.id)}
                mutationError={mutationErrors.get(row.id)}
                isLeaving={isLeaving}
                onExited={() => handleExited(row.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
