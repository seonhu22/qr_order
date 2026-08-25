import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { MOCK_STORE_NAME } from '@/apps/consumer/features/session/api/consumerSessionApi';
import './QrLoadingScreen.css';

type QrLoadingScreenProps = {
  /** mock 단계에서만 미리 알 수 있는 테이블 번호 — 없으면 테이블 카드를 생략한다. */
  tableNum?: number;
};

/**
 * QR 인증 중(loading) 화면 — 참고 저장소(Qrorder)의 LoadingScreen과 동일한 구성
 * (브랜드 로고 + 매장명 + 테이블 카드 + 점 3개 로딩 인디케이터)을 이 프로젝트 토큰으로 재현한다.
 * 매장명은 실제 매장명 API가 없어 세션 stub과 동일한 임시 매장명(MOCK_STORE_NAME)을 쓴다.
 */
export function QrLoadingScreen({ tableNum }: QrLoadingScreenProps) {
  return (
    <div className="qr-loading-screen">
      <div className="qr-loading-screen__blob qr-loading-screen__blob--top" aria-hidden="true" />
      <div className="qr-loading-screen__blob qr-loading-screen__blob--bottom" aria-hidden="true" />

      <div className="qr-loading-screen__content">
        <div className="qr-loading-screen__brand">
          <div className="qr-loading-screen__brand-icon" aria-hidden="true">
            <ConsumerIcon id="ci-qr-code" size={20} />
          </div>
          <span className="qr-loading-screen__brand-text">
            <strong>QR</strong>order
          </span>
        </div>

        <p className="qr-loading-screen__store">{MOCK_STORE_NAME}</p>

        {tableNum != null && (
          <div className="qr-loading-screen__table-card">
            <p className="qr-loading-screen__table-label">테이블</p>
            <p className="qr-loading-screen__table-number">{tableNum}번</p>
          </div>
        )}

        <div className="qr-loading-screen__indicator">
          <p>메뉴를 불러오는 중</p>
          <span className="qr-loading-screen__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}
