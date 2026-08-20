import './OrderStatusBoard.css';
import { OrderStatusColumn } from './OrderStatusColumn';
import type { OrderBoardCardActions, OrderBoardColumnData } from '../types';

type OrderStatusBoardProps = {
  columns: OrderBoardColumnData[];
  actions: OrderBoardCardActions;
  lastMovedIds: string[];
  pendingOrderIds: Set<string>;
  mutationErrors: Map<string, string>;
};

export function OrderStatusBoard({ columns, actions, lastMovedIds, pendingOrderIds, mutationErrors }: OrderStatusBoardProps) {
  return (
    <div className="order-status-board">
      {columns.map((column) => (
        <OrderStatusColumn key={column.status} column={column} actions={actions} lastMovedIds={lastMovedIds} pendingOrderIds={pendingOrderIds} mutationErrors={mutationErrors} />
      ))}
    </div>
  );
}
