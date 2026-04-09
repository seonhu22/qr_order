// src/apps/admin/layout/AdminLayout.tsx

import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import '@/apps/admin/layout/AdminLayout.css';
import { AdminSidebar } from '@/apps/admin/features/sidebar/components/AdminSidebar';
import { AdminHeader } from '@/apps/admin/features/header/components/AdminHeader';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';

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
  const isSidebarOpen = useAdminLayoutStore((state) => state.isSidebarOpen);
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sidebarElement = sidebarRef.current;

    if (!sidebarElement) {
      return;
    }

    // 사이드바가 닫힌 동안 내부 포커스 요소까지 비활성화해 접근성 경고를 줄인다.
    if (isSidebarOpen) {
      sidebarElement.removeAttribute('inert');
      return;
    }

    sidebarElement.setAttribute('inert', '');
  }, [isSidebarOpen]);

  return (
    <div className="admin-layout">
      {/* ---- 사이드바 ---- */}
      <aside
        ref={sidebarRef}
        className={`admin-layout__sidebar${isSidebarOpen ? '' : ' admin-layout__sidebar--closed'}`}
        aria-label="사이드 내비게이션"
      >
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
