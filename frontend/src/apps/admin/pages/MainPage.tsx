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

import '@/apps/admin/pages/MainPage.css';
import { useDashboardInfo } from '@/apps/admin/hooks/useDashboardInfo';
import { LoadingState } from '@/shared/components/feedback';

export function MainPage() {
  const { data, isLoading, isError } = useDashboardInfo();

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
          {isLoading ? (
            // 로딩 피드백
            <LoadingState message="대시보드 데이터를 불러오는 중입니다." />
          ) : null}
          {isError ? (
            // 에러 피드백
            <p className="admin-main-page__placeholder-copy">
              대시보드 데이터를 불러오지 못했습니다.
            </p>
          ) : null}
          {!isLoading && !isError ? (
            // 성공적으로 데이터를 불러왔을 때 보여줄 곳
            <p className="admin-main-page__placeholder-copy">
              대시보드 응답 메시지: {data?.message ?? '메시지가 없습니다.'}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
