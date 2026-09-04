import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { Button } from '@/shared/components/button';
import './OrderCompleteScreen.css';

type OrderCompleteScreenProps = {
  /** "메뉴로 돌아가기" 클릭 — 메인 화면으로 되돌아간다. */
  onConfirm: () => void;
  /** 사용자에게 보여줄 짧은 주문번호. 없으면 번호 줄을 렌더하지 않는다. */
  orderNo?: string;
};

/**
 * 주문 접수 성공 후 보여주는 전체화면 — 참고 저장소(Qrorder)의 OrderCompleteScreen과
 * 동일한 구성(블롭 배경 + 체크 링 아이콘 + 안내 문구 + 메뉴로 돌아가기 버튼)을
 * 이 프로젝트 토큰으로 재현한다.
 */
export function OrderCompleteScreen({ onConfirm, orderNo }: OrderCompleteScreenProps) {
  return (
    <div className="order-complete-screen" role="alert" aria-live="assertive">
      <div className="order-complete-screen__blob order-complete-screen__blob--top" aria-hidden="true" />
      <div className="order-complete-screen__blob order-complete-screen__blob--bottom" aria-hidden="true" />

      <div className="order-complete-screen__content">
        <div className="order-complete-screen__icon-ring" aria-hidden="true">
          <div className="order-complete-screen__icon-circle">
            <ConsumerIcon id="ci-check" size={36} className="order-complete-screen__icon" />
          </div>
        </div>

        <div className="order-complete-screen__text">
          <p className="order-complete-screen__title">주문 완료</p>
          {orderNo && (
            <p className="order-complete-screen__order-no">
              주문번호 <strong>{orderNo}</strong>
            </p>
          )}
          <p className="order-complete-screen__description">
            주문이 성공적으로 접수되었습니다.
            <br />
            잠시 후 음식이 나올 예정입니다.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="order-complete-screen__action"
          onClick={onConfirm}
        >
          메뉴로 돌아가기
        </Button>
      </div>
    </div>
  );
}
