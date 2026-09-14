import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import './SessionExpiredScreen.css';

type SessionExpiredScreenProps = {
  /** 'timeout': 장시간 비활동으로 세션 만료. 'closed': 결제 완료로 주문 마감. */
  variant: 'timeout' | 'closed';
};

/**
 * 세션 종료 전체화면 — 참고 저장소(Qrorder)의 SessionExpiredScreen과 동일한 구성을
 * 이 프로젝트 토큰으로 재현한다. QR코드를 다시 찍어야 하는 최종 상태라 별도 액션 버튼이 없다.
 */
export function SessionExpiredScreen({ variant }: SessionExpiredScreenProps) {
  const isTimeout = variant === 'timeout';

  return (
    <div className="session-expired-screen" role="alert" aria-live="assertive">
      <div className="session-expired-screen__blob session-expired-screen__blob--top" aria-hidden="true" />
      <div className="session-expired-screen__blob session-expired-screen__blob--bottom" aria-hidden="true" />

      <div className="session-expired-screen__content">
        <div className="session-expired-screen__icon-wrap" aria-hidden="true">
          <ConsumerIcon
            id={isTimeout ? 'ci-clock' : 'ci-lock'}
            size={32}
            className="session-expired-screen__icon"
          />
        </div>

        <p className="session-expired-screen__title">
          {isTimeout ? '주문 시간이 초과되었습니다' : <>결제가 완료되어<br />주문이 마감되었습니다</>}
        </p>

        <p className="session-expired-screen__description">
          {isTimeout ? (
            <>
              장시간 활동이 없어 안전하게 연결을 종료했습니다.
              <br />
              QR코드를 다시 찍어 주문을 진행해 주세요.
            </>
          ) : (
            <>
              이전 주문 및 결제가 정상적으로 처리되었습니다.
              <br />
              추가 주문을 원하시면 QR코드를 다시 찍어주세요.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
