import '@/apps/admin/layout/AdminMainLayout.css';
import { AdminMainNavigation } from '@/apps/admin/common/components/AdminMainNavigation';

export default function AdminMainLayout({
  adminMainTitle,
  depth1,
  depth2,
  children,
}: {
  adminMainTitle: string;
  depth1: string;
  depth2: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-main-layout-page" aria-labelledby="admin-main-layout-page-title">
      <h1 id="admin-main-layout-page-title" className="admin-main-layout-page__sr-only">
        {adminMainTitle}
      </h1>

      {/* 네비게이션 */}
      <AdminMainNavigation depth1={depth1} depth2={depth2} current={adminMainTitle} />

      {children}
    </section>
  );
}
