import { AppLoadingScreen } from '@/shared/components/loading';
import { MOCK_STORE_NAME } from '@/apps/consumer/features/session/api/consumerSessionApi';
import './QrLoadingScreen.css';

type QrLoadingScreenProps = {
  /** mock 단계에서만 미리 알 수 있는 테이블 번호 — 없으면 테이블 카드를 생략한다. */
  tableNum?: number;
};

/**
 * QR 인증 중(loading) 화면 — 공용 `AppLoadingScreen`(블롭 + 브랜드 로고 + 점 3개 인디케이터)에
 * consumer 전용 내용(매장명·테이블 카드)만 얹는다. 매장명은 실제 매장명 API가 없어 세션 stub과
 * 동일한 임시 매장명(MOCK_STORE_NAME)을 쓴다.
 */
export function QrLoadingScreen({ tableNum }: QrLoadingScreenProps) {
  return (
    <AppLoadingScreen message="메뉴를 불러오는 중">
      <p className="qr-loading-screen__store">{MOCK_STORE_NAME}</p>

      {tableNum != null && (
        <div className="qr-loading-screen__table-card">
          <p className="qr-loading-screen__table-label">테이블</p>
          <p className="qr-loading-screen__table-number">{tableNum}번</p>
        </div>
      )}
    </AppLoadingScreen>
  );
}
