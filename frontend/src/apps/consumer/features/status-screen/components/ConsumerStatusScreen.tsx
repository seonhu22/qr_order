import '@/apps/consumer/features/status-screen/styles/ConsumerStatusScreen.css';
import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';

type ConsumerStatusScreenAction = {
  label: string;
  onClick: () => void;
};

type ConsumerStatusScreenProps = {
  iconId: string;
  title: string;
  description?: string;
  action?: ConsumerStatusScreenAction;
  /** 통신 오류처럼 경고 톤이 필요할 때 'danger' — 기본은 중립 톤. */
  tone?: 'neutral' | 'danger';
};

/**
 * QR 인증 실패·통신 오류·세션 만료/마감처럼 ConsumerLayout(헤더·장바구니)이 아직 없는
 * 전체 화면 상태에서 공통으로 쓰는 안내 화면. QrEntryPage와 ConsumerSessionGuard가 공유한다.
 * 참고 저장소(Qrorder)의 InvalidQRPage와 같은 블롭 배경 패턴(QrLoadingScreen 등과 동일)을 쓴다.
 */
export function ConsumerStatusScreen({
  iconId,
  title,
  description,
  action,
  tone = 'neutral',
}: ConsumerStatusScreenProps) {
  return (
    <section className="consumer-status-screen" role="alert" aria-live="assertive">
      <div className="consumer-status-screen__blob consumer-status-screen__blob--top" aria-hidden="true" />
      <div className="consumer-status-screen__blob consumer-status-screen__blob--bottom" aria-hidden="true" />

      <div className="consumer-status-screen__content">
        <div
          className={`consumer-status-screen__icon-wrap consumer-status-screen__icon-wrap--${tone}`}
          aria-hidden="true"
        >
          <ConsumerIcon id={iconId} size={32} />
        </div>
        <h1 className="consumer-status-screen__title">{title}</h1>
        {description && <p className="consumer-status-screen__description">{description}</p>}
        {action && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="consumer-status-screen__action"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </section>
  );
}
