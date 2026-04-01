// src/apps/admin/components/AdminPlaceholderPage.tsx

/**
 * 관리자 페이지의 placeholder 컴포넌트
 * 라우팅 연결을 위한 임시 화면으로 사용됨
 *
 * @component
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 페이지 제목
 * @returns {JSX.Element} 관리자 페이지 placeholder UI
 */
const AdminPlaceholderPage = ({ title }: { title: string }) => {
  return (
    <section className="admin-main-page" aria-labelledby="admin-placeholder-title">
      <header className="admin-main-page__header">
        <h1 id="admin-placeholder-title" className="admin-main-page__title">
          {title}
        </h1>
        <p className="admin-main-page__description">
          현재 페이지는 라우팅 연결을 위한 placeholder 화면입니다.
        </p>
      </header>

      <div className="admin-main-page__canvas">
        <div className="admin-main-page__placeholder">
          <strong className="admin-main-page__placeholder-title">{title}</strong>
          <p className="admin-main-page__placeholder-copy">
            기능 화면은 다음 단계에서 실제 데이터와 연결합니다.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdminPlaceholderPage;
