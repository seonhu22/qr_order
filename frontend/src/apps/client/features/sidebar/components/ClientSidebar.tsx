import '@/apps/client/features/sidebar/styles/ClientSidebarHeader.css';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import { useSidebarExpand } from '@/shared/components/sidebar/useSidebarExpand';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';
import { Icon } from '@/shared/assets/icons/Icon';
import { findClientExpandedMenuKeys } from '@/shared/menu/clientNavigation';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserDisplayName, getAuthUserRoleLabel } from '@/shared/auth/authUserDisplay';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { useClientNavigationMenus } from '@/apps/client/hooks/useClientNavigationMenus';
import { useGuardedNavigate } from '@/shared/hooks/useGuardedNavigate';

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guardedNavigate, requestLeaveConfirm } = useGuardedNavigate();
  const isSidebarOpen = useClientLayoutStore((s) => s.isSidebarOpen);
  const closeSidebar = useClientLayoutStore((s) => s.closeSidebar);
  const activeSection = useClientLayoutStore((s) => s.activeSection);
  const { currentSection, currentMenus, menusBySection } = useClientNavigationMenus();
  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => navigate('/client/login', { replace: true }),
      onError: () => navigate('/client/login', { replace: true }),
    },
  });

  const {
    expandedDepth1Keys,
    expandedDepth2Keys,
    toggleDepth1,
    toggleDepth2,
    ensureOpen,
    resetTo,
  } = useSidebarExpand();

  const userName = getAuthUserDisplayName(user, '사용자');
  const userRole = getAuthUserRoleLabel(user, 'CLIENT');

  // AdminSidebar와 동일한 우선순위: 사용자가 선택한 섹션 > 현재 경로의 섹션
  const displayedSection =
    activeSection && menusBySection[activeSection]?.length ? activeSection : currentSection;
  const sectionMenus = displayedSection ? menusBySection[displayedSection] ?? [] : currentMenus;
  // 표시할 섹션이 없는 경우(예: /client/main) 전체 섹션의 메뉴를 펼쳐서 보여준다.
  const displayedMenus = sectionMenus.length > 0 ? sectionMenus : Object.values(menusBySection).flat();

  // 최신 pathname·menus를 effect 내부에서 stale closure 없이 참조하기 위한 ref
  const pathnameRef = useRef(location.pathname);
  const displayedMenusRef = useRef(displayedMenus);
  useLayoutEffect(() => {
    pathnameRef.current = location.pathname;
    displayedMenusRef.current = displayedMenus;
  });

  // URL 변경 시 현재 페이지 그룹 열기 (다른 열린 그룹은 유지)
  useEffect(() => {
    const { depth1Key, depth2Key } = findClientExpandedMenuKeys(location.pathname, displayedMenus);
    if (!depth1Key) return;
    ensureOpen(depth1Key, depth2Key);
  }, [displayedMenus, ensureOpen, location.pathname]);

  // 사이드바가 열릴 때 현재 페이지 그룹만 남기고 나머지 닫기
  useEffect(() => {
    if (!isSidebarOpen) return;
    const { depth1Key, depth2Key } = findClientExpandedMenuKeys(
      pathnameRef.current,
      displayedMenusRef.current,
    );
    resetTo(depth1Key, depth2Key);
  }, [isSidebarOpen, resetTo]);

  // 섹션 전환 시 expand 상태 초기화
  useEffect(() => {
    const { depth1Key, depth2Key } = findClientExpandedMenuKeys(
      pathnameRef.current,
      displayedMenusRef.current,
    );
    resetTo(depth1Key, depth2Key);
  }, [activeSection, resetTo]);

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
      {/* ---- 헤더 ---- */}
      <div className="client-sidebar-header">
        <ClientBrand />
        <button
          type="button"
          className="client-sidebar-header__close"
          aria-label="사이드바 닫기"
          onClick={closeSidebar}
        >
          <Icon id="i-close" size={16} />
        </button>
      </div>

      {/* ---- 내비게이션 ---- */}
      <SidebarNav
        menus={displayedMenus}
        showDepth1={!displayedSection}
        expandedDepth1Keys={expandedDepth1Keys}
        expandedDepth2Keys={expandedDepth2Keys}
        currentPathname={location.pathname}
        onToggleDepth1={toggleDepth1}
        onToggleDepth2={toggleDepth2}
        onNavigate={guardedNavigate}
      />

      {/* ---- 사용자 푸터 ---- */}
      <SidebarUser
        userName={userName}
        userRole={userRole}
        onLogout={handleLogoutClick}
        isLoggingOut={isPending}
      />
    </Sidebar>
  );
}
