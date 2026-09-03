import { useEffect, type ReactNode } from 'react';
import { ConsumerStatusScreen } from '@/apps/consumer/features/status-screen/components/ConsumerStatusScreen';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import type { ConsumerSessionStatus } from '@/apps/consumer/features/session/types';
import { useConsumerCartStore } from '@/apps/consumer/features/order-shell/stores/consumerCartStore';
import './ConsumerSessionGuard.css';

type InactiveStatus = Exclude<ConsumerSessionStatus, 'active'>;

const STATUS_SCREEN_CONFIG: Record<
  InactiveStatus,
  { iconId: string; title: string; description: string }
> = {
  none: {
    iconId: 'ci-qr-code',
    title: '연결된 주문 세션이 없습니다.',
    description: '테이블의 QR코드를 다시 스캔해 주세요.',
  },
  expired: {
    iconId: 'ci-clock',
    title: '주문 세션이 만료되었습니다.',
    description: 'QR코드를 다시 스캔해 주세요.',
  },
  closed: {
    iconId: 'ci-check-circle',
    title: '주문이 마감되었습니다.',
    description: '이용해 주셔서 감사합니다.',
  },
  error: {
    iconId: 'ci-wifi-off',
    title: '세션 정보를 불러오지 못했습니다.',
    description: '네트워크 상태를 확인한 뒤 새로고침해 주세요.',
  },
};

type ConsumerSessionGuardProps = {
  children: ReactNode;
};

/**
 * 로그인 인증이 아닌 QR 세션 유효성을 확인하는 경계.
 * 세션이 없거나 만료/마감이면 관리자·점주 로그인이 아닌 QR 재스캔 안내를 보여준다.
 */
export function ConsumerSessionGuard({ children }: ConsumerSessionGuardProps) {
  const { isLoading, status } = useConsumerSession();
  const clearCart = useConsumerCartStore((state) => state.clearCart);

  useEffect(() => {
    if (!isLoading && (status === 'expired' || status === 'closed')) {
      clearCart();
    }
  }, [clearCart, isLoading, status]);

  if (isLoading) {
    return <main className="consumer-session-guard" aria-label="세션 확인 중" />;
  }

  if (status !== 'active') {
    const config = STATUS_SCREEN_CONFIG[status];
    return (
      <main className="consumer-session-guard" aria-label="주문 세션 안내">
        <ConsumerStatusScreen
          iconId={config.iconId}
          title={config.title}
          description={config.description}
        />
      </main>
    );
  }

  return <>{children}</>;
}
