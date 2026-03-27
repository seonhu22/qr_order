import './AdminSidebar.css';
import { AdminSidebarHeader } from './AdminSidebarHeader';
import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminSidebarUser } from './AdminSidebarUser';

/**
 * AdminSidebar — 사이드바 Template
 *
 * --sb-* CSS 변수 컨텍스트 제공 + 세 Wrapper 조합
 *   <header> AdminSidebarHeader  — 브랜드 + 닫기
 *   <nav>    AdminSidebarNav     — 3계층 트리 내비게이션
 *   <footer> AdminSidebarUser   — 사용자 정보 + 로그아웃
 */
export function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <AdminSidebarHeader />
      <AdminSidebarNav />
      <AdminSidebarUser />
    </div>
  );
}
