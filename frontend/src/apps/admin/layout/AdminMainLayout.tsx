import '@/apps/admin/layout/AdminMainLayout.css';
import { AdminMainNavigation } from '@/apps/admin/common/components/AdminMainNavigation';

export default function AdminMainLayout({
  adminMainTitle,
  depth1,
  depth2,
  children,
  className,
  filterSlot,
}: {
  adminMainTitle: string;
  depth1: string;
  depth2: string;
  children: React.ReactNode;
  /** 레이아웃 변형 클래스 (예: admin-main-layout-page--fixed) */
  className?: string;
  /** 브레드크럼 아래, 콘텐츠 위에 고정 높이로 배치되는 검색 필터 영역 */
  filterSlot?: React.ReactNode;
}) {
  return (
    <section
      className={`admin-main-layout-page${className ? ` ${className}` : ''}`}
      aria-labelledby="admin-main-layout-page-title"
    >
      <h1 id="admin-main-layout-page-title" className="admin-main-layout-page__sr-only">
        {adminMainTitle}
      </h1>

      {/* 브레드크럼 네비게이션: 스크롤과 무관하게 상단에 고정 */}
      <AdminMainNavigation depth1={depth1} depth2={depth2} current={adminMainTitle} />

      {/* 검색 필터 슬롯: 브레드크럼과 콘텐츠 사이, 고정 높이 */}
      {filterSlot && (
        <div className="admin-main-layout-page__filter">{filterSlot}</div>
      )}

      <div className="admin-main-layout-page__content">{children}</div>
    </section>
  );
}
