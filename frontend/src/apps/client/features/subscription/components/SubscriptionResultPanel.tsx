import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/button';
import { FeedbackState } from '@/shared/components/feedback';
import {
  getSubscriptionErrorMessage,
  useClientSubscription,
  useReconcileSubscription,
} from '../api/subscriptionApi';
import { describeSubscription, SUBSCRIPTION_STATUS_LABEL } from '../utils/subscriptionDisplay';
import './Subscription.css';

/** 서버와 같은 간격. 버튼은 누른 뒤 이 시간 동안 잠긴다. */
export const RECONCILE_COOLDOWN_MS = 10_000;

/** 결제창에서 돌아온 화면. 웹훅이 늦을 수 있어 "재확인" = 서버가 결제사를 다시 조회 → 상태 + /api/auth/me 갱신. */
export function SubscriptionResultPanel() {
  const subscription = useClientSubscription();
  const reconcileMutation = useReconcileSubscription();
  const [coolingDown, setCoolingDown] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!coolingDown) return undefined;
    const timer = window.setTimeout(() => setCoolingDown(false), RECONCILE_COOLDOWN_MS);
    return () => window.clearTimeout(timer);
  }, [coolingDown]);

  if (subscription.isLoading) return <FeedbackState variant="loading" />;
  if (subscription.isError || !subscription.data?.status) return <FeedbackState variant="error" />;
  const data = subscription.data;

  const recheck = async () => {
    setCoolingDown(true);
    setMessage('');
    try {
      const next = await reconcileMutation.mutateAsync();
      setMessage(next.status === 'ACTIVE' ? '결제가 확인되었습니다.' : '아직 결제가 확인되지 않았습니다. 잠시 뒤 다시 확인해 주세요.');
    } catch (failure) {
      setMessage(getSubscriptionErrorMessage(failure, '결제 결과를 확인하지 못했습니다.'));
    }
  };

  return (
    <section className="subscription-card" aria-label="결제 결과">
      <div className="subscription-card__header">
        <h2 className="subscription-card__title">결제 결과</h2>
        {data.status && <span className="subscription-card__status">{SUBSCRIPTION_STATUS_LABEL[data.status]}</span>}
      </div>
      <p className="subscription-card__description">{describeSubscription(data)}</p>
      <div className="subscription-card__actions">
        {data.isOwner && (
          <Button onClick={recheck} loading={reconcileMutation.isPending} disabled={coolingDown}>
            결제 결과 재확인
          </Button>
        )}
        <Link to="/client/subscription">구독 정보로</Link>
      </div>
      {message && <p role="status" className="subscription-card__message">{message}</p>}
    </section>
  );
}
