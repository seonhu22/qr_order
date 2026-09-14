import type { ReactNode } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import './AppLoadingScreen.css';

type AppLoadingScreenProps = {
  message: string;
  /** 브랜드 로고 아래, 인디케이터 위에 끼워 넣을 내용 (예: QR 진입의 매장명·테이블 카드) */
  children?: ReactNode;
};

/**
 * 전체화면 브랜드 로딩 화면 — 참고 저장소(Qrorder)의 AppLoadingScreen과 동일한 구성
 * (블롭 장식 + "QRorder" 브랜드 로고 + 점 3개 바운스 인디케이터)을 이 프로젝트 토큰으로 재현한다.
 * consumer의 QrLoadingScreen과 앱 루트(AppRoutes)의 인증 로딩이 이 공용 컴포넌트를 함께 쓴다.
 */
export function AppLoadingScreen({ message, children }: AppLoadingScreenProps) {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-screen__blob app-loading-screen__blob--top" aria-hidden="true" />
      <div className="app-loading-screen__blob app-loading-screen__blob--bottom" aria-hidden="true" />

      <div className="app-loading-screen__content">
        <div className="app-loading-screen__brand">
          <div className="app-loading-screen__brand-icon" aria-hidden="true">
            <Icon id="i-qr" size={20} />
          </div>
          <span className="app-loading-screen__brand-text">
            <strong>QR</strong>order
          </span>
        </div>

        {children}

        <div className="app-loading-screen__indicator">
          <p>{message}</p>
          <span className="app-loading-screen__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}
