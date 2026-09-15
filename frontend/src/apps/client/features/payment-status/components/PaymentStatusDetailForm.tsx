import { TableCard, TableCardContentState } from '@/shared/components/table';
import { TextInput, TextareaInput } from '@/shared/components/input';
import { PaymentOrderItemsList } from './PaymentOrderItemsList';
import type { PaymentStatusDetail } from '../types';

const PAYMENT_STATUS_LABEL: Record<PaymentStatusDetail['paymentStatus'], string> = {
  PAID: '결제완료',
  UNPAID: '미결제',
};

/**
 * 사유/상세 사유 필드는 미결제(UNPAID) 건에만 의미가 있다 — 결제완료(PAID) 건은 필드 자체를 표시하지 않는다.
 */
const REASON_FIELD_LABEL: Partial<Record<PaymentStatusDetail['paymentStatus'], { reason: string; description: string }>> = {
  UNPAID: { reason: '미결제 사유', description: '미결제 상세 사유' },
};

type PaymentStatusDetailFormProps = {
  detail: PaymentStatusDetail | null;
  isLoading: boolean;
  isError: boolean;
  hasSelection: boolean;
};

export function PaymentStatusDetailForm({
  detail,
  isLoading,
  isError,
  hasSelection,
}: PaymentStatusDetailFormProps) {
  const reasonLabel = detail ? REASON_FIELD_LABEL[detail.paymentStatus] : undefined;

  return (
    <TableCard title="결제 목록 상세" ariaLabel="결제 목록 상세" className="payment-status-detail-form-card">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && !hasSelection}
        loadingTitle="결제 상세를 불러오는 중입니다."
        emptyVariant="select"
        emptyDescription="좌측 목록에서 항목을 선택하면 결제 상세를 조회할 수 있습니다."
      >
        <div className="payment-status-detail-form">
          <TextInput
            label="결제번호"
            className="payment-status-detail-form__field"
            readOnly
            value={detail?.orderNo ?? ''}
          />

          <TextInput
            label="결제 상태"
            className="payment-status-detail-form__field"
            readOnly
            value={detail ? PAYMENT_STATUS_LABEL[detail.paymentStatus] : ''}
          />

          <TextInput
            label="결제 수단"
            className="payment-status-detail-form__field"
            readOnly
            value={detail && detail.paymentStatus === 'PAID' ? detail.paymentType || '-' : '-'}
          />

          {reasonLabel && (
            <TextInput
              label={reasonLabel.reason}
              className="payment-status-detail-form__field"
              readOnly
              value={detail?.cancelReason?.trim() || '-'}
            />
          )}

          <PaymentOrderItemsList items={detail?.items ?? ''} />

          {reasonLabel && (
            <TextareaInput
              label={reasonLabel.description}
              className="payment-status-detail-form__field"
              readOnly
              value={detail?.cancelDescription?.trim() || '-'}
              rows={4}
            />
          )}
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
