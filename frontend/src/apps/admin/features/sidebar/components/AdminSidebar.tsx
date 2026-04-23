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

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import { useSidebarExpand } from '@/shared/components/sidebar/useSidebarExpand';
import { AdminSidebarHeader } from '@/apps/admin/features/sidebar/components/AdminSidebarHeader';
import { SYSTEM_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/systemSidebarMenu';
import { BOARD_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/boardSidebarMenu';
import {
  findExpandedMenuKeys,
  detectSectionFromPath,
} from '@/apps/admin/features/sidebar/utils/findExpandedMenuKeys';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';
import { useAuth } from '@/shared/auth/AuthContext';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSidebarOpen = useAdminLayoutStore((s) => s.isSidebarOpen);
  const activeSection = useAdminLayoutStore((s) => s.activeSection);
  const setActiveSection = useAdminLayoutStore((s) => s.setActiveSection);

  const { expandedDepth1Keys, expandedDepth2Keys, toggleDepth1, toggleDepth2, ensureOpen, resetTo } =
    useSidebarExpand();

  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login'),
      onError: () => navigate('/admin/login'),
    },
  });

  const currentMenus = activeSection === 'board' ? BOARD_SIDEBAR_MENU : SYSTEM_SIDEBAR_MENU;

  // 최신 pathname·menus를 effect 내부에서 stale closure 없이 참조하기 위한 ref
  const pathnameRef = useRef(location.pathname);
  const currentMenusRef = useRef(currentMenus);
  useLayoutEffect(() => {
    pathnameRef.current = location.pathname;
    currentMenusRef.current = currentMenus;
  });

  // URL 변경 시에만 섹션 자동 감지 + 현재 페이지 그룹 열기
  // activeSection을 deps에 넣으면 헤더 탭 전환 시에도 effect가 재실행되어
  // URL 기반으로 섹션을 되돌려버리는 문제가 발생하므로 의도적으로 제외한다.
  useEffect(() => {
    const detectedSection = detectSectionFromPath(location.pathname);
    if (detectedSection) {
      setActiveSection(detectedSection);
    }

    const menus = detectedSection === 'board' ? BOARD_SIDEBAR_MENU : SYSTEM_SIDEBAR_MENU;
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname, menus);
    if (!depth1Key) return;
    ensureOpen(depth1Key, depth2Key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 사이드바가 열릴 때 현재 페이지 그룹만 남기고 나머지 닫기
  useEffect(() => {
    if (!isSidebarOpen) return;
    const { depth1Key, depth2Key } = findExpandedMenuKeys(pathnameRef.current, currentMenusRef.current);
    resetTo(depth1Key, depth2Key);
  }, [isSidebarOpen, resetTo]);

  // 섹션 전환 시 expand 상태 초기화
  useEffect(() => {
    const { depth1Key, depth2Key } = findExpandedMenuKeys(pathnameRef.current, currentMenusRef.current);
    resetTo(depth1Key, depth2Key);
  }, [activeSection, resetTo]);

  const userName =
    typeof user?.userName === 'string'
      ? user.userName
      : typeof user?.userId === 'string'
        ? user.userId
        : '관리자';

  const userRole = typeof user?.role === 'string' ? user.role : 'ADMIN';

  const sectionLabel = activeSection === 'board' ? '게시판' : '시스템';

  return (
    <Sidebar>
      <AdminSidebarHeader />
      <div className="admin-sidebar-section">
        <span className="admin-sidebar-section__label">{sectionLabel}</span>
      </div>
      <SidebarNav
        menus={currentMenus}
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
