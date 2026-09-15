/**
 * @fileoverview 매장 > 결제 > 정산 조회 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 상태 계산은 `useSettlementPageState` feature hook에서 처리한다.
 */

import './SettlementListPage.css';
import { SettlementFilters } from '@/apps/client/features/settlement/components/SettlementFilters';
import { SettlementSummaryCards } from '@/apps/client/features/settlement/components/SettlementSummaryCards';
import { SettlementTable } from '@/apps/client/features/settlement/components/SettlementTable';
import { useSettlementPageState } from '@/apps/client/features/settlement/hooks/useSettlementPageState';

export function SettlementListPage() {
  const { data, status, actions, uiProps } = useSettlementPageState();

  return (
    <section className="settlement-page" aria-label="정산 조회">
      <SettlementFilters
        draftPreset={uiProps.draftPreset}
        draftStartDate={uiProps.draftStartDate}
        draftEndDate={uiProps.draftEndDate}
        dateRangeError={uiProps.dateRangeError}
        onPresetChange={actions.handlePresetChange}
        onStartDateChange={actions.handleStartDateChange}
        onEndDateChange={actions.handleEndDateChange}
        onSearch={actions.handleSearch}
        onReset={actions.handleReset}
      />

      <SettlementSummaryCards summary={data.summary} />

      <p className="settlement-page__formula-hint">
        <strong>순매출</strong> = 총 결제 금액 − 취소 금액 − 할인 금액 · 취소 상태 주문의 결제 금액은 취소 금액으로 집계
      </p>

      <SettlementTable
        rows={data.rows}
        isLoading={status.isLoading}
        isError={status.isError}
        emptyMessage={uiProps.emptyMessage}
      />
    </section>
  );
}
