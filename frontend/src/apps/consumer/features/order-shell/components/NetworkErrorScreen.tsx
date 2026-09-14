import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';
import './NetworkErrorScreen.css';

type NetworkErrorScreenProps = {
  /** "다시 시도하기" 클릭. */
  onRetry: () => void;
};

/**
 * 통신(연결 끊김) 오류 전체화면 — 참고 저장소(Qrorder)의 NetworkErrorScreen과 동일한 구성을
 * 이 프로젝트 토큰으로 재현한다. 주문 실패(OrderFailureScreen)와 달리 앱 전체의 연결 상태
 * 문제를 알리는 화면이라 위험(red) 톤 아이콘을 쓴다. 실제 navigator.onLine 감지는 아직 붙지
 * 않아 QA 트리거로만 진입한다.
 */
export function NetworkErrorScreen({ onRetry }: NetworkErrorScreenProps) {
  return (
    <div className="network-error-screen" role="alert" aria-live="assertive">
      <div className="network-error-screen__blob network-error-screen__blob--top" aria-hidden="true" />
      <div className="network-error-screen__blob network-error-screen__blob--bottom" aria-hidden="true" />

      <div className="network-error-screen__content">
        <div className="network-error-screen__icon-wrap" aria-hidden="true">
          <ConsumerIcon id="ci-alert-triangle" size={34} className="network-error-screen__icon" />
        </div>

        <div className="network-error-screen__text">
          <p className="network-error-screen__title">연결이 원활하지 않습니다</p>
          <p className="network-error-screen__description">
            통신 상태가 불안정하여 연결이 원활하지 않습니다.
            <br />
            주변 환경이나 통신 상태를 확인하신 후
            <br />
            다시 시도해 주세요.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="network-error-screen__action"
          onClick={onRetry}
        >
          다시 시도하기
        </Button>
      </div>
    </div>
  );
}
