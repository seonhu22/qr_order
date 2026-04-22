/**
 * @fileoverview 관리자 사이드바 어댑터
 *
 * @description
 * 공용 Sidebar / SidebarNav / SidebarUser 컴포넌트를
 * 어드민 전용 데이터·상태(스토어, auth, 라우터)와 연결하는 어댑터 역할.
 *
 *   <header> AdminSidebarHeader — 브랜드 + 닫기 버튼 (어드민 전용)
 *   <nav>    SidebarNav         — 3계층 트리 내비게이션 (공용)
 *   <footer> SidebarUser        — 사용자 정보 + 로그아웃 (공용)
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import { useSidebarExpand } from '@/shared/components/sidebar/useSidebarExpand';
import { AdminSidebarHeader } from '@/apps/admin/features/sidebar/components/AdminSidebarHeader';
import { ADMIN_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/adminSidebarMenu';
import { findExpandedMenuKeys } from '@/apps/admin/features/sidebar/utils/findExpandedMenuKeys';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';
import { useAuth } from '@/shared/auth/AuthContext';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSidebarOpen = useAdminLayoutStore((s) => s.isSidebarOpen);

  const { expandedDepth1Keys, expandedDepth2Keys, toggleDepth1, toggleDepth2, ensureOpen, resetTo } =
    useSidebarExpand();

  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login'),
      onError: () => navigate('/admin/login'),
    },
  });

  // URL 변경 시 현재 페이지 그룹을 열린 상태로 보장 (기존 열린 그룹 유지)
  useEffect(() => {
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname);
    if (!depth1Key) return;
    ensureOpen(depth1Key, depth2Key);
  }, [location.pathname, ensureOpen]);

  // 사이드바가 열릴 때 현재 페이지 그룹만 남기고 나머지 닫기
  useEffect(() => {
    if (!isSidebarOpen) return;
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname);
    resetTo(depth1Key, depth2Key);
  }, [isSidebarOpen]);

  const userName =
    typeof user?.userName === 'string'
      ? user.userName
      : typeof user?.userId === 'string'
        ? user.userId
        : '관리자';

  const userRole = typeof user?.role === 'string' ? user.role : 'ADMIN';

  return (
    <Sidebar>
      <AdminSidebarHeader />
      <SidebarNav
        menus={ADMIN_SIDEBAR_MENU}
        showDepth1={false}
        expandedDepth1Keys={expandedDepth1Keys}
        expandedDepth2Keys={expandedDepth2Keys}
        currentPathname={location.pathname}
        onToggleDepth1={toggleDepth1}
        onToggleDepth2={toggleDepth2}
        onNavigate={navigate}
      />
      <SidebarUser
        userName={userName}
        userRole={userRole}
        onLogout={() => logoutMutate()}
        isLoggingOut={isPending}
      />
    </Sidebar>
  );
}
