/**
 * @fileoverview 매장 > 주문 > 주문 이력 조회 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 상태 계산은 `useOrderHistoryPageState` feature hook에서 처리한다.
 */

import './OrderHistoryListPage.css';
import { OrderHistoryFilters } from '@/apps/client/features/order-history/components/OrderHistoryFilters';
import { OrderHistoryTable } from '@/apps/client/features/order-history/components/OrderHistoryTable';
import { useOrderHistoryPageState } from '@/apps/client/features/order-history/hooks/useOrderHistoryPageState';

export function OrderHistoryListPage() {
  const { data, status, actions, uiProps } = useOrderHistoryPageState();

  return (
    <section className="order-history-page" aria-label="주문 이력 조회">
      <OrderHistoryFilters
        draftKeyword={uiProps.draftKeyword}
        draftOrderStatus={uiProps.draftOrderStatus}
        draftPreset={uiProps.draftPreset}
        draftStartDate={uiProps.draftStartDate}
        draftEndDate={uiProps.draftEndDate}
        dateRangeError={uiProps.dateRangeError}
        onKeywordChange={actions.handleKeywordChange}
        onOrderStatusChange={actions.handleOrderStatusChange}
        onPresetChange={actions.handlePresetChange}
        onStartDateChange={actions.handleStartDateChange}
        onEndDateChange={actions.handleEndDateChange}
        onSearch={actions.handleSearch}
        onReset={actions.handleReset}
      />

      <OrderHistoryTable
        rows={data.rows}
        isLoading={status.isLoading}
        isError={status.isError}
        emptyMessage={uiProps.emptyMessage}
      />
    </section>
  );
}
