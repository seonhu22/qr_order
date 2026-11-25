import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { ConfirmModal } from '@/shared/components/modal';
import { FeedbackState } from '@/shared/components/feedback';
import {
  formatKst,
  formatWon,
  INVOICE_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from '@/shared/utils/subscriptionFormat';
import {
  getAdminSubscriptionErrorMessage,
  PROBLEM_LABEL,
  useAdminSubscriptionDetail,
  useEndSubscription,
  useRefundInvoice,
} from '../api/adminSubscriptionApi';
import type { AdminInvoiceRow } from '../types';
import './AdminSubscription.css';

function RefundForm({ sysId, invoice, onMessage }: {
  sysId: string;
  invoice: AdminInvoiceRow;
  onMessage: (message: string) => void;
}) {
  const [amount, setAmount] = useState(String(invoice.refundable));
  const refundMutation = useRefundInvoice();
  const submit = async () => {
    try {
      const result = await refundMutation.mutateAsync({ sysId, invoiceSysId: invoice.invoiceSysId, amount: Number(amount) });
      onMessage(result.message ?? '환불을 요청했습니다.');
    } catch (failure) {
      onMessage(getAdminSubscriptionErrorMessage(failure, '환불을 요청하지 못했습니다.'));
    }
  };
  return (
    <span className="admin-subscription__refund">
      <input aria-label={`${invoice.providerInvoiceId} 환불 금액`} inputMode="numeric" value={amount}
        onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} />
      <Button size="sm" variant="outline" onClick={submit} loading={refundMutation.isPending} disabled={!amount}>
        환불
      </Button>
    </span>
  );
}

/** 구독 상세: 인보이스(문제 건 표시 + 환불), 웹훅 이력, 즉시 종료. */
export function AdminSubscriptionDetailPanel({ sysId }: { sysId: string }) {
  const detail = useAdminSubscriptionDetail(sysId);
  const endMutation = useEndSubscription();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [message, setMessage] = useState('');

  if (detail.isLoading) return <FeedbackState variant="loading" />;
  if (detail.isError || !detail.data) return <FeedbackState variant="error" />;
  const { subscription, invoices, events, canEnd, providerSubscriptionId } = detail.data;

  const submitEnd = async () => {
    setConfirmEnd(false);
    try {
      await endMutation.mutateAsync(sysId);
      setMessage('구독을 종료했습니다.');
    } catch (failure) {
      setMessage(getAdminSubscriptionErrorMessage(failure, '구독을 종료하지 못했습니다.'));
    }
  };

  return (
    <section className="admin-subscription__detail" aria-label="구독 상세">
      <header className="admin-subscription__detail-header">
        <h3>{subscription.plantNm || subscription.plantCd} / {subscription.ownerUserId}</h3>
        <span>{SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status}</span>
        <span>제공자 구독 {providerSubscriptionId || '-'}</span>
        <span>제공자 종료 {subscription.providerEndStatus}</span>
        {canEnd && <Button size="sm" variant="danger" onClick={() => setConfirmEnd(true)}>즉시 종료</Button>}
      </header>
      {message && <p role="status" className="admin-subscription__message">{message}</p>}
      <table className="admin-subscription__table" aria-label="인보이스">
        <thead>
          <tr><th>인보이스</th><th>기간</th><th>금액</th><th>상태</th><th>반영</th><th>환불</th></tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.invoiceSysId} className={invoice.problem ? 'admin-subscription__problem' : undefined}>
              <td>{invoice.providerInvoiceId}</td>
              <td>{formatKst(invoice.periodStartAt)} ~ {formatKst(invoice.periodEndAt)}</td>
              <td>{formatWon(invoice.amount)}{invoice.refundedAmount > 0 ? ` (환불 ${formatWon(invoice.refundedAmount)})` : ''}</td>
              <td>{INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}</td>
              <td>{invoice.problem ? `문제: ${PROBLEM_LABEL[invoice.applyResult] ?? invoice.applyResult}` : invoice.applyResult}</td>
              <td>{invoice.refundable > 0 && <RefundForm sysId={sysId} invoice={invoice} onMessage={setMessage} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="admin-subscription__table" aria-label="웹훅 이력">
        <thead><tr><th>수신</th><th>이벤트</th><th>대상</th><th>결과</th></tr></thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.webhookId}>
              <td>{formatKst(event.receivedAt)}</td><td>{event.eventType}</td><td>{event.resourceId}</td><td>{event.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        open={confirmEnd}
        tone="danger"
        title="구독을 즉시 종료할까요?"
        description="만료 처리하고 이 구독이 올린 대표 권한(01)을 02로 되돌린 뒤 결제사 구독을 끝냅니다."
        onClose={() => setConfirmEnd(false)}
        primaryAction={{ label: '즉시 종료', onClick: submitEnd }}
        secondaryAction={{ onClick: () => setConfirmEnd(false) }}
      />
    </section>
  );
}
