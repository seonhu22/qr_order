import '@/apps/client/pages/main/MainPage.css';

export function MainPage() {
  return (
    <section className="client-main-page" aria-labelledby="client-main-page-title">
      <header className="client-main-page__header">
        <h1 id="client-main-page-title" className="client-main-page__title">
          클라이언트 메인
        </h1>
        <p className="client-main-page__description">
          현재 페이지는 클라이언트 레이아웃 확인을 위한 빈 컨테이너입니다.
        </p>
      </header>

      <div className="client-main-page__canvas">
        <div className="client-main-page__placeholder">
          <strong className="client-main-page__placeholder-title">/client/main</strong>
          <p className="client-main-page__placeholder-copy">
            클라이언트 대시보드 콘텐츠가 이곳에 추가됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}
