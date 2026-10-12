import './OrderStatusBoard.css';
import { OrderStatusColumn } from './OrderStatusColumn';
import { StaffCallBoardColumn } from './StaffCallBoardColumn';
import type { OrderBoardCardActions, OrderBoardColumnData, StaffCallBoardRow } from '../types';

type OrderStatusBoardProps = {
  columns: OrderBoardColumnData[];
  actions: OrderBoardCardActions;
  lastMovedIds: string[];
  pendingOrderIds: Set<string>;
  mutationErrors: Map<string, string>;
  staffCall: {
    rows: StaffCallBoardRow[];
    onComplete: (id: string) => Promise<void>;
    pendingIds: Set<string>;
    errors: Map<string, string>;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
  };
};

export function OrderStatusBoard({
  columns,
  actions,
  lastMovedIds,
  pendingOrderIds,
  mutationErrors,
  staffCall,
}: OrderStatusBoardProps) {
  return (
    <div className="order-status-board">
      {columns.map((column) => (
        <OrderStatusColumn key={column.status} column={column} actions={actions} lastMovedIds={lastMovedIds} pendingOrderIds={pendingOrderIds} mutationErrors={mutationErrors} />
      ))}
      <StaffCallBoardColumn
        rows={staffCall.rows}
        onComplete={staffCall.onComplete}
        pendingIds={staffCall.pendingIds}
        errors={staffCall.errors}
        isLoading={staffCall.isLoading}
        isError={staffCall.isError}
        onRetry={staffCall.onRetry}
      />
    </div>
  );
}
