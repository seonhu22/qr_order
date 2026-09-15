import './OrderProcessingScreen.css';

/**
 * "주문하기" 클릭 직후 보여주는 전체화면 처리중 상태 — 참고 저장소(Qrorder)의
 * OrderProcessingOverlay와 동일한 구성(블롭 배경 + 원형 스피너 + 안내 문구)을
 * 이 프로젝트 토큰으로 재현한다. 배경 블롭은 QrLoadingScreen과 같은 패턴이다.
 */
export function OrderProcessingScreen() {
  return (
    <div className="order-processing-screen" role="alert" aria-live="assertive">
      <div className="order-processing-screen__blob order-processing-screen__blob--top" aria-hidden="true" />
      <div className="order-processing-screen__blob order-processing-screen__blob--bottom" aria-hidden="true" />

      <div className="order-processing-screen__content">
        <div className="order-processing-screen__icon-wrap" aria-hidden="true">
          <span className="order-processing-screen__spinner" />
        </div>
        <div>
          <p className="order-processing-screen__title">주문 처리중</p>
          <p className="order-processing-screen__description">
            잠시만 기다려주세요, 주문 접수가 진행 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
