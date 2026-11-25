import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';
import { useClientSubscription } from '../api/subscriptionApi';
import { getSubscriptionBanners } from '../utils/subscriptionDisplay';
import './Subscription.css';

const BANNER_TEXT = {
  ownerBeforePayment: '구독 결제 후 메뉴/직원 관리가 열립니다.',
  cardExpired: '등록된 카드가 만료되었습니다. 다음 결제 전에 결제수단을 확인해 주세요.',
} as const;

/** Client 레이아웃 상단 안내. 구독이 없는 매장(레거시/관리자)에는 아무것도 그리지 않는다. */
export function SubscriptionBanner() {
  const { isAuthenticated, user } = useAuth();
  const subscription = useClientSubscription(isAuthenticated);
  const banners = getSubscriptionBanners(subscription.data, getAuthUserStaffRole(user));
  if (banners.length === 0) return null;
  return (
    <div className="subscription-banners">
      {banners.map((kind) => (
        <div key={kind} role="status" className={`subscription-banner subscription-banner--${kind}`}>
          <span>{BANNER_TEXT[kind]}</span>
          <Link to="/client/subscription">구독 정보 보기</Link>
        </div>
      ))}
    </div>
  );
}
