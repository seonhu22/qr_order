import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import { AdminBrand } from '../components/AdminBrand';

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
        <div className="admin-layout__sidebar-brand">
          <AdminBrand />
        </div>
        <nav className="admin-layout__nav" aria-label="메인 메뉴">
          {/* TODO: 메뉴 아이템 */}
        </nav>
      </aside>

      {/* ---- 오른쪽 콘텐츠 래퍼 ---- */}
      <div className="admin-layout__content">
        <header className="admin-layout__header">
          {/* TODO: 페이지 제목, 사용자 정보 */}
        </header>
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
