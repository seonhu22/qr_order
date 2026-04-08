import '@/apps/admin/layout/AdminMainLayout.css';
import { AdminMainNavigation } from '@/apps/admin/common/components/AdminMainNavigation';

export default function AdminMainLayout({
  adminMainTitle,
  depth1,
  depth2,
  children,
  className,
}: {
  adminMainTitle: string;
  depth1: string;
  depth2: string;
  children: React.ReactNode;
  /** 레이아웃 변형 클래스 (예: admin-main-layout-page--fixed) */
  className?: string;
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

      {/*
        콘텐츠 영역: 기본 flex row
        - 1개 → 풀 너비
        - 2개 → 동일 비율 (50/50)
        - 3개 → 동일 비율 (33/33/33)
      */}
      <div className="admin-main-layout-page__content">{children}</div>
    </section>
  );
}
