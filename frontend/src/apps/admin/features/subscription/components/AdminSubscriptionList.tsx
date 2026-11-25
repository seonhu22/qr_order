import { useState } from 'react';
import { FeedbackState } from '@/shared/components/feedback';
import { formatKst, SUBSCRIPTION_STATUS_LABEL } from '@/shared/utils/subscriptionFormat';
import { useAdminSubscriptions } from '../api/adminSubscriptionApi';
import { AdminSubscriptionDetailPanel } from './AdminSubscriptionDetailPanel';
import './AdminSubscription.css';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  ...Object.entries(SUBSCRIPTION_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

/** /admin/subscriptions 본문: 목록(매장/대표/상태/기간/권한 부여/문제 건) + 선택한 구독 상세 + 불일치 웹훅. */
export function AdminSubscriptionList() {
  const [status, setStatus] = useState('');
  const [problemOnly, setProblemOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const subscriptions = useAdminSubscriptions(status, problemOnly);

  return (
    <div className="admin-subscription">
      <div className="admin-subscription__filters">
        <select aria-label="구독 상태" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={problemOnly} onChange={(event) => setProblemOnly(event.target.checked)} />
          문제 건만
        </label>
      </div>
      {subscriptions.isLoading && <FeedbackState variant="loading" />}
      {subscriptions.isError && <FeedbackState variant="error" />}
      {subscriptions.data && (
        <>
          {subscriptions.data.rows.length === 0 ? <FeedbackState variant="empty" /> : (
            <table className="admin-subscription__table" aria-label="구독 목록">
              <thead>
                <tr><th>매장</th><th>대표</th><th>상태</th><th>이용 기간 끝</th><th>권한 부여</th><th>문제 건</th></tr>
              </thead>
              <tbody>
                {subscriptions.data.rows.map((row) => (
                  <tr key={row.subscriptionSysId}
                    className={row.subscriptionSysId === selected ? 'admin-subscription__selected' : undefined}>
                    <td>
                      <button type="button" className="admin-subscription__link" onClick={() => setSelected(row.subscriptionSysId)}>
                        {row.plantNm || row.plantCd}
                      </button>
                    </td>
                    <td>{row.ownerUserId} ({row.ownerUserRole})</td>
                    <td>
                      {SUBSCRIPTION_STATUS_LABEL[row.status] ?? row.status}
                      {row.cardExpired ? ' / 카드 만료' : ''}
                    </td>
                    <td>{formatKst(row.endAt ?? row.paidThroughAt)}</td>
                    <td>{row.roleGranted ? '구독 01' : '-'}</td>
                    <td className={row.problemCount > 0 ? 'admin-subscription__problem' : undefined}>{row.problemCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {subscriptions.data.mismatchEvents.length > 0 && (
            <section aria-label="연결 불일치 웹훅" className="admin-subscription__mismatch">
              <h3>연결 불일치 웹훅</h3>
              <ul>
                {subscriptions.data.mismatchEvents.map((event) => (
                  <li key={event.webhookId}>{formatKst(event.receivedAt)} {event.eventType} {event.resourceId}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {selected && <AdminSubscriptionDetailPanel sysId={selected} />}
    </div>
  );
}
