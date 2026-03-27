// src/apps/admin/pages/MainPage.tsx

/**
 * @fileoverview 관리자 메인 페이지
 *
 * @description
 * - `/admin/main`에서 렌더링되는 초기 진입 페이지이다.
 * - 현재 단계에서는 빈 컨테이너 레이아웃과 기본 안내 문구만 제공한다.
 *
 * @param {never} _unused 이 페이지는 별도 props를 받지 않는다.
 * @returns {JSX.Element}
 * @example
 * <MainPage />
 */

import './MainPage.css';

export function MainPage() {
  return (
    <section className="admin-main-page" aria-labelledby="admin-main-page-title">
      <header className="admin-main-page__header">
        <h1 id="admin-main-page-title" className="admin-main-page__title">
          관리자 메인
        </h1>
        <p className="admin-main-page__description">
          현재 페이지는 관리자 레이아웃 확인을 위한 빈 컨테이너입니다.
        </p>
      </header>

      <div className="admin-main-page__canvas">
        <div className="admin-main-page__placeholder">
          <strong className="admin-main-page__placeholder-title">/admin/main</strong>
          <p className="admin-main-page__placeholder-copy">
            Header, Sidebar, Container 구조를 우선 점검한 뒤 실제 기능 화면을 배치합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
