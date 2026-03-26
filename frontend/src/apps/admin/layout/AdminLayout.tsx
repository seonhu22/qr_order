import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

/**
 * 관리자 메인 레이아웃
 *
 * 사이드바(좌) + 헤더 + 콘텐츠 영역(우) 3단 구조
 * React Router <Outlet /> 으로 하위 페이지를 렌더링
 *
 * @example
 * // AdminRoutes.jsx
 * { path: '/dashboard', element: <AdminLayout />, children: [...] }
 */
export function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* ---- 사이드바 ---- */}
      <aside className="admin-layout__sidebar" aria-label="사이드 내비게이션">
        <AdminSidebar />
      </aside>

      {/* ---- 오른쪽 콘텐츠 래퍼 ---- */}
      <div className="admin-layout__content">
        <header className="admin-layout__header">
          <AdminHeader />
        </header>
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
