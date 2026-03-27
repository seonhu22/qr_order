// src/apps/admin/layout/AdminLayout.tsx

import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

/**
 * 관리자 메인 레이아웃
 *
 * @description
 * - `/admin/*` 보호 라우트에서 사용하는 공통 레이아웃이다.
 * - 사이드바(좌) + 헤더 + 콘텐츠 영역(우) 3단 구조를 유지한다.
 * - React Router `<Outlet />` 으로 `/admin/main` 등 child route를 렌더링한다.
 *
 * @example
 * // AdminRoutes.jsx
 * { path: '/admin', element: <AdminLayout />, children: [...] }
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
