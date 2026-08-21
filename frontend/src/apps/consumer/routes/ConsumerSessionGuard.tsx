import type { ReactNode } from 'react';
import { ConsumerStatusScreen } from '@/apps/consumer/features/status-screen/components/ConsumerStatusScreen';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import type { ConsumerSessionStatus } from '@/apps/consumer/features/session/types';
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
};

type ConsumerSessionGuardProps = {
  children: ReactNode;
};

// 실제 세션 조회 API(GET /api/consumer/session)가 없어 지금 단계에서는 가드를 끈다 — QR 세션 여부와
// 무관하게 children을 그대로 보여준다. 아래 분기 로직은 API가 생겼을 때 그대로 켜서 쓰도록 남겨둔다.
const SESSION_GUARD_ENABLED = false;

/**
 * 로그인 인증이 아닌 QR 세션 유효성을 확인하는 경계.
 * 세션이 없거나 만료/마감이면 관리자·점주 로그인이 아닌 QR 재스캔 안내를 보여준다.
 */
export function ConsumerSessionGuard({ children }: ConsumerSessionGuardProps) {
  const { isLoading, status } = useConsumerSession();

  if (!SESSION_GUARD_ENABLED) {
    return <>{children}</>;
  }

  // 실제 세션 조회 API가 없어 아직 "로딩"이라 부를 만한 기능이 없다 — 세션 없음 화면이 잠깐 잘못
  // 보이는 것만 막는 빈 프레임이며, 실제 API 연동 시 여기에 의미 있는 로딩 UI를 넣는다.
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
