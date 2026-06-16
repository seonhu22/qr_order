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
import { useAdminNavigationMenus } from '@/apps/admin/hooks/useAdminNavigationMenus';
import { AdminSidebarHeader } from '@/apps/admin/features/sidebar/components/AdminSidebarHeader';
import {
  findExpandedMenuKeys,
} from '@/apps/admin/features/sidebar/utils/findExpandedMenuKeys';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserDisplayName, getAuthUserRoleLabel } from '@/shared/auth/authUserDisplay';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';
import { useGuardedNavigate } from '@/shared/hooks/useGuardedNavigate';

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guardedNavigate, requestLeaveConfirm } = useGuardedNavigate();

  const isSidebarOpen = useAdminLayoutStore((s) => s.isSidebarOpen);
  const activeSection = useAdminLayoutStore((s) => s.activeSection);
  const setActiveSection = useAdminLayoutStore((s) => s.setActiveSection);

  const { expandedDepth1Keys, expandedDepth2Keys, toggleDepth1, toggleDepth2, ensureOpen, resetTo } =
    useSidebarExpand();
  const { currentSection, currentMenus, menusBySection, isError, error } = useAdminNavigationMenus();
  const menuErrorStatus = getErrorStatus(error);
  const hasMenuLoadError = isError && menuErrorStatus !== 403;

  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/admin/login'),
      onError: () => navigate('/admin/login'),
    },
  });

  const displayedSection =
    (activeSection && menusBySection[activeSection]?.length ? activeSection : null) ??
    currentSection ??
    Object.keys(menusBySection)[0] ??
    null;
  const displayedMenus = displayedSection ? menusBySection[displayedSection] ?? [] : currentMenus;

  // 최신 pathname·menus를 effect 내부에서 stale closure 없이 참조하기 위한 ref
  const pathnameRef = useRef(location.pathname);
  const currentMenusRef = useRef(displayedMenus);
  useLayoutEffect(() => {
    pathnameRef.current = location.pathname;
    currentMenusRef.current = displayedMenus;
  });

  useEffect(() => {
    if (menuErrorStatus !== 403 || location.pathname === '/admin/forbidden') {
      return;
    }

    navigate('/admin/forbidden', { replace: true });
  }, [location.pathname, menuErrorStatus, navigate]);

  // URL 변경 시에만 섹션 자동 감지 + 현재 페이지 그룹 열기
  // activeSection을 deps에 넣으면 헤더 탭 전환 시에도 effect가 재실행되어
  // URL 기반으로 섹션을 되돌려버리는 문제가 발생하므로 의도적으로 제외한다.
  useEffect(() => {
    if (currentSection) {
      setActiveSection(currentSection);
    }

    const menus = currentSection ? menusBySection[currentSection] ?? [] : currentMenus;
    const { depth1Key, depth2Key } = findExpandedMenuKeys(location.pathname, menus);
    if (!depth1Key) return;
    ensureOpen(depth1Key, depth2Key);
  }, [currentMenus, currentSection, ensureOpen, location.pathname, menusBySection, setActiveSection]);

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

  const userName = getAuthUserDisplayName(user, '관리자');
  const userRole = getAuthUserRoleLabel(user, 'ADMIN');

  const sectionLabel = displayedMenus[0]?.label ?? displayedSection ?? '';

  const handleLogoutClick = () => {
    requestLeaveConfirm({
      type: 'custom',
      title: '로그아웃하시겠습니까?',
      description: '저장하지 않은 내용이 있습니다.\n로그아웃하면 변경사항이 사라집니다.',
      confirmLabel: '로그아웃',
      onConfirm: () => logoutMutate(),
    });
  };

  return (
    <Sidebar>
      <AdminSidebarHeader />
      <div className="admin-sidebar-section">
        <span className="admin-sidebar-section__label">{sectionLabel}</span>
      </div>
      {hasMenuLoadError ? (
        <div className="admin-sidebar-status" role="status">
          메뉴를 불러오지 못했습니다.
        </div>
      ) : (
        <SidebarNav
          menus={displayedMenus}
          showDepth1={false}
          expandedDepth1Keys={expandedDepth1Keys}
          expandedDepth2Keys={expandedDepth2Keys}
          currentPathname={location.pathname}
          onToggleDepth1={toggleDepth1}
          onToggleDepth2={toggleDepth2}
          onNavigate={guardedNavigate}
        />
      )}
      <SidebarUser
        userName={userName}
        userRole={userRole}
        onLogout={handleLogoutClick}
        isLoggingOut={isPending}
      />
    </Sidebar>
  );
}
