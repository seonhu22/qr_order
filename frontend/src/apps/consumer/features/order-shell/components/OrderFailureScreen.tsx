import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';
import './OrderFailureScreen.css';

type OrderFailureScreenProps = {
  type: 'network' | 'duplicate';
  /** type이 'duplicate'일 때만 사용 — 먼저 접수된 주문 시각. */
  duplicateTime?: string;
  /** "메인화면으로 이동" 클릭. */
  onGoMain: () => void;
  /** type이 'network'일 때 "다시 시도하기" 클릭. */
  onRetry?: () => void;
  /** type이 'duplicate'일 때 "주문내역 확인하기" 클릭. */
  onHistory?: () => void;
};

/**
 * 주문 제출 실패 전체화면 — 참고 저장소(Qrorder)의 OrderErrorScreen과 동일한 구성을
 * 이 프로젝트 토큰으로 재현한다. network/duplicate 두 사례를 하나의 컴포넌트로 다룬다.
 */
export function OrderFailureScreen({
  type,
  duplicateTime,
  onGoMain,
  onRetry,
  onHistory,
}: OrderFailureScreenProps) {
  return (
    <div className="order-failure-screen" role="alert" aria-live="assertive">
      <div className="order-failure-screen__blob order-failure-screen__blob--top" aria-hidden="true" />
      <div className="order-failure-screen__blob order-failure-screen__blob--bottom" aria-hidden="true" />

      <div className="order-failure-screen__content">
        <div className="order-failure-screen__icon-wrap" aria-hidden="true">
          <ConsumerIcon id="ci-alert-triangle" size={28} className="order-failure-screen__icon" />
        </div>

        {type === 'network' ? (
          <div className="order-failure-screen__text">
            <p className="order-failure-screen__title">주문 연결이 원활하지 않습니다.</p>
            <p className="order-failure-screen__description">
              아래 버튼을 눌러 다시 시도하거나,
              <br />
              메인으로 이동해 다시 주문해 주세요.
            </p>
          </div>
        ) : (
          <div className="order-failure-screen__text">
            <p className="order-failure-screen__title">
              이미 같은 테이블에서
              <br />
              주문이 접수되었습니다
            </p>
            <p className="order-failure-screen__description">
              동일한 테이블에서 선주문이 완료되어 취소되었습니다.
              <br />
              주문 내역을 확인해 주세요.
            </p>
            {duplicateTime && (
              <div className="order-failure-screen__badge">
                <ConsumerIcon id="ci-clock" size={11} />
                {duplicateTime} 접수 완료
              </div>
            )}
          </div>
        )}

        <div className="order-failure-screen__actions">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="order-failure-screen__action-outline"
            onClick={onGoMain}
          >
            메인화면으로 이동
          </Button>
          {type === 'network' ? (
            <Button type="button" variant="primary" size="lg" onClick={onRetry}>
              다시 시도하기
            </Button>
          ) : (
            <Button type="button" variant="primary" size="lg" onClick={onHistory}>
              주문내역 확인하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
