import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/button';
import { ConfirmModal } from '@/shared/components/modal';
import { FeedbackState } from '@/shared/components/feedback';
import {
  getCheckoutRedirectUrl,
  getSubscriptionErrorMessage,
  useCancelSubscription,
  useCheckoutSubscription,
  useClientSubscription,
  useSubscriptionInvoices,
} from '../api/subscriptionApi';
import { formatKst, formatWon, SUBSCRIPTION_STATUS_LABEL } from '@/shared/utils/subscriptionFormat';
import { describeSubscription } from '../utils/subscriptionDisplay';
import { SubscriptionInvoiceTable } from './SubscriptionInvoiceTable';
import './Subscription.css';

type Props = {
  /** 결제창으로 이동. 테스트에서 바꿔 끼운다. */
  navigateTo?: (url: string) => void;
};

/** /client/subscription 본문. 직원은 상태만 보고, 대표만 결제/해지/이력을 쓴다(서버도 같은 규칙으로 403). */
export function SubscriptionPanel({ navigateTo = (url) => window.location.assign(url) }: Props) {
  const subscription = useClientSubscription();
  const data = subscription.data;
  const invoicesQuery = useSubscriptionInvoices(data?.isOwner === true);
  const checkoutMutation = useCheckoutSubscription();
  const cancelMutation = useCancelSubscription();
  const [planSysId, setPlanSysId] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!planSysId && data?.plans.length) setPlanSysId(data.planSysId ?? data.plans[0].planSysId);
  }, [data, planSysId]);

  if (subscription.isLoading) return <FeedbackState variant="loading" />;
  if (subscription.isError || !data) return <FeedbackState variant="error" />;
  if (!data.hasSubscription || !data.status) {
    return <FeedbackState variant="empty" title="구독 정보가 없습니다." description="이 매장은 구독 대상이 아닙니다." />;
  }

  const startCheckout = async () => {
    setError('');
    try {
      const launch = await checkoutMutation.mutateAsync(planSysId);
      const url = getCheckoutRedirectUrl(launch);
      if (url) navigateTo(url);
      else setError('이 결제사는 아직 결제창을 열 수 없습니다.');
    } catch (failure) {
      setError(getSubscriptionErrorMessage(failure, '결제를 시작하지 못했습니다.'));
    }
  };

  const submitCancel = async () => {
    setConfirmCancel(false);
    setError('');
    try {
      await cancelMutation.mutateAsync();
    } catch (failure) {
      setError(getSubscriptionErrorMessage(failure, '해지하지 못했습니다.'));
    }
  };

  const checkoutLabel = data.status === 'PAST_DUE' ? '결제수단 다시 등록' : data.status === 'EXPIRED' ? '다시 구독' : '결제하기';

  return (
    <section className="subscription-card" aria-label="구독 정보">
      <div className="subscription-card__header">
        <h2 className="subscription-card__title">{data.planName ?? '구독'}</h2>
        <span className="subscription-card__status">{SUBSCRIPTION_STATUS_LABEL[data.status]}</span>
      </div>
      <p className="subscription-card__description">{describeSubscription(data)}</p>
      <dl className="subscription-card__facts">
        {data.amount != null && (<><dt>금액</dt><dd>{formatWon(data.amount)} / 월</dd></>)}
        {data.paidThroughAt && (<><dt>이용 기간 끝</dt><dd>{formatKst(data.paidThroughAt)}</dd></>)}
        {data.cardExpired && (<><dt>결제수단</dt><dd>카드 만료</dd></>)}
      </dl>
      {!data.isOwner && <p className="subscription-card__message">결제와 해지는 매장 대표만 할 수 있습니다.</p>}
      {data.isOwner && (
        <div className="subscription-card__actions">
          {data.canCheckout && data.plans.length > 0 && (
            <>
              {data.status !== 'PAST_DUE' && (
                <select aria-label="플랜" value={planSysId} onChange={(event) => setPlanSysId(event.target.value)}>
                  {data.plans.map((plan) => (
                    <option key={plan.planSysId} value={plan.planSysId}>
                      {plan.planName} ({formatWon(plan.amount)} / {plan.periodMonth}개월)
                    </option>
                  ))}
                </select>
              )}
              <Button onClick={startCheckout} loading={checkoutMutation.isPending} disabled={!planSysId}>
                {checkoutLabel}
              </Button>
            </>
          )}
          {data.canCancel && (
            <Button variant="secondary" onClick={() => setConfirmCancel(true)} loading={cancelMutation.isPending}>
              해지 예약
            </Button>
          )}
        </div>
      )}
      {error && <p role="alert" className="subscription-card__message subscription-card__message--error">{error}</p>}
      {data.isOwner && <SubscriptionInvoiceTable rows={invoicesQuery.data ?? []} />}
      <ConfirmModal
        open={confirmCancel}
        tone="danger"
        title="구독을 해지 예약할까요?"
        description={data.paidThroughAt
          ? `${formatKst(data.paidThroughAt)}까지 이용한 뒤 끝나고 메뉴/직원 관리가 닫힙니다.`
          : '결제 전 구독은 바로 끝납니다.'}
        onClose={() => setConfirmCancel(false)}
        primaryAction={{ label: '해지 예약', onClick: submitCancel }}
        secondaryAction={{ onClick: () => setConfirmCancel(false) }}
      />
    </section>
  );
}
