import { TableCard, TableCardContentState } from '@/shared/components/table';
import { TextInput, TextareaInput } from '@/shared/components/input';
import type { PaymentStatusDetail } from '../types';

const PAYMENT_STATUS_LABEL: Record<PaymentStatusDetail['paymentStatus'], string> = {
  PAID: '결제완료',
  UNPAID: '미결제',
  DINING: '식사중',
};

/** 취소 사유/취소 상세 사유는 결제완료 건에만 의미가 있다 — 미결제·식사중 건은 항상 "-"로 표시한다. */
function formatCancelField(detail: PaymentStatusDetail | null, rawValue: string): string {
  if (!detail) return '';
  if (detail.paymentStatus !== 'PAID') return '-';
  return rawValue.trim() ? rawValue : '-';
}

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
            label="주문번호"
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
            label="취소 사유"
            className="payment-status-detail-form__field"
            readOnly
            value={formatCancelField(detail, detail?.cancelReason ?? '')}
          />

          <TextareaInput
            label="주문 내역"
            className="payment-status-detail-form__field"
            readOnly
            value={detail?.items ?? ''}
            rows={4}
          />

          <TextareaInput
            label="취소 상세 사유"
            className="payment-status-detail-form__field"
            readOnly
            value={formatCancelField(detail, detail?.cancelDescription ?? '')}
            rows={4}
          />
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
