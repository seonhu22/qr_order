import './OrderStatusBoard.css';
import { OrderStatusColumn } from './OrderStatusColumn';
import type { OrderBoardCardActions, OrderBoardColumnData } from '../types';

type OrderStatusBoardProps = {
  columns: OrderBoardColumnData[];
  actions: OrderBoardCardActions;
  lastMovedId: string | null;
};

export function OrderStatusBoard({ columns, actions, lastMovedId }: OrderStatusBoardProps) {
  return (
    <div className="order-status-board">
      {columns.map((column) => (
        <OrderStatusColumn key={column.status} column={column} actions={actions} lastMovedId={lastMovedId} />
      ))}
    </div>
  );
}
