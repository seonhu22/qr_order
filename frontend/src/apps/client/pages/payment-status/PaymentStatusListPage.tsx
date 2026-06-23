/**
 * @fileoverview 매장 > 결제 > 결제 목록 조회 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 상태 계산은 `usePaymentStatusPageState` feature hook에서 처리한다.
 */

import './PaymentStatusListPage.css';
import { PaymentStatusFilters } from '@/apps/client/features/payment-status/components/PaymentStatusFilters';
import { PaymentStatusMasterTable } from '@/apps/client/features/payment-status/components/PaymentStatusMasterTable';
import { PaymentStatusDetailForm } from '@/apps/client/features/payment-status/components/PaymentStatusDetailForm';
import { usePaymentStatusPageState } from '@/apps/client/features/payment-status/hooks/usePaymentStatusPageState';

export function PaymentStatusListPage() {
  const { data, status, actions, uiProps } = usePaymentStatusPageState();

  return (
    <section className="payment-status-page" aria-label="결제 목록 조회">
      <PaymentStatusFilters
        draftKeyword={uiProps.draftKeyword}
        draftPaymentStatus={uiProps.draftPaymentStatus}
        draftPreset={uiProps.draftPreset}
        draftStartDate={uiProps.draftStartDate}
        draftEndDate={uiProps.draftEndDate}
        dateRangeError={uiProps.dateRangeError}
        onKeywordChange={actions.handleKeywordChange}
        onPaymentStatusChange={actions.handlePaymentStatusChange}
        onPresetChange={actions.handlePresetChange}
        onStartDateChange={actions.handleStartDateChange}
        onEndDateChange={actions.handleEndDateChange}
        onSearch={actions.handleSearch}
        onReset={actions.handleReset}
      />

      <div className="payment-status-page__layout">
        <PaymentStatusMasterTable
          rows={data.rows}
          isLoading={status.isLoadingMaster}
          isError={status.isErrorMaster}
          emptyMessage={uiProps.emptyMessage}
          selectedId={uiProps.selectedId}
          onSelectRow={actions.handleSelectRow}
        />

        <PaymentStatusDetailForm
          detail={data.detail}
          isLoading={status.isLoadingDetail}
          isError={status.isErrorDetail}
          hasSelection={uiProps.hasSelection}
        />
      </div>
    </section>
  );
}
