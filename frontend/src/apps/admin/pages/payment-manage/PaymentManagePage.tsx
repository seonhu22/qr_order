import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import { PaymentManageFilters } from '@/apps/admin/features/payment-manage/components/PaymentManageFilters';
import { PaymentManageTable } from '@/apps/admin/features/payment-manage/components/PaymentManageTable';
import { usePaymentManagePageState } from '@/apps/admin/features/payment-manage/hooks/usePaymentManagePageState';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import './PaymentManagePage.css';

export function PaymentManagePage() {
  const { data, uiProps, actions } = usePaymentManagePageState();

  return (
    <>
      <AdminMainLayout
        adminMainTitle="결제 요금 관리"
        depth1="시스템"
        depth2="결제 관리"
        filterSlot={
          <PaymentManageFilters
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <PaymentManageTable
          rows={data.rows}
          checkedIds={uiProps.checkedIds}
          isAllChecked={uiProps.isAllChecked}
          onToggleRow={actions.handleToggleRow}
          onToggleAll={actions.handleToggleAll}
          onCreate={actions.handleCreate}
          onDelete={actions.handleDelete}
          onOpenDetail={actions.handleOpenDetail}
        />
      </AdminMainLayout>

      <WrapperModal
        open={uiProps.detailRow !== null}
        title="결제 요금 상세"
        onClose={actions.handleCloseDetail}
        secondaryAction={{ label: '닫기', onClick: actions.handleCloseDetail }}
      >
        {uiProps.detailRow && (
          <div>
            <div className="payment-manage-detail__row">
              <span className="payment-manage-detail__label">결제 요금 코드</span>
              <span className="payment-manage-detail__value">{uiProps.detailRow.rateCode}</span>
            </div>
            <div className="payment-manage-detail__row">
              <span className="payment-manage-detail__label">결제 요금 명</span>
              <span className="payment-manage-detail__value">{uiProps.detailRow.rateName}</span>
            </div>
            <div className="payment-manage-detail__row">
              <span className="payment-manage-detail__label">결제 요금</span>
              <span className="payment-manage-detail__value">
                {uiProps.detailRow.rateAmount.toLocaleString()} {uiProps.detailRow.rateUnit}
              </span>
            </div>
            <div className="payment-manage-detail__row">
              <span className="payment-manage-detail__label">라이센스 기간</span>
              <span className="payment-manage-detail__value">{uiProps.detailRow.licensePeriod}</span>
            </div>
          </div>
        )}
      </WrapperModal>
    </>
  );
}
