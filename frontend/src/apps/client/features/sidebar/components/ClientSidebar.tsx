import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarSection, SidebarUser } from '@/shared/components/sidebar';
import { useSidebarExpand } from '@/shared/components/sidebar/useSidebarExpand';
import { ClientSidebarHeader } from '@/apps/client/features/sidebar/components/ClientSidebarHeader';
import { findClientExpandedMenuKeys } from '@/shared/menu/clientNavigation';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserDisplayName } from '@/shared/auth/authUserDisplay';
import { useAuthLogoutMutation } from '@/shared/auth/hooks/useAuthLogoutMutation';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { useClientNavigationMenus } from '@/apps/client/hooks/useClientNavigationMenus';
import { useGuardedNavigate } from '@/shared/hooks/useGuardedNavigate';
import { getClientUserAuthorityLabel } from '@/apps/client/features/client-user/constants';

function getClientSidebarRoleCode(user: Record<string, unknown> | null) {
  const staffRole = user?.staffRole;
  if (typeof staffRole === 'string' && staffRole.trim()) return staffRole;

  const userRole = user?.userRole;
  if (typeof userRole === 'string' && userRole.trim()) return userRole;

  return '02';
}

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guardedNavigate, requestLeaveConfirm } = useGuardedNavigate();
  const isSidebarOpen = useClientLayoutStore((s) => s.isSidebarOpen);
  const activeSection = useClientLayoutStore((s) => s.activeSection);
  const resetLayout = useClientLayoutStore((s) => s.resetLayout);
  const { currentSection, currentMenus, menusBySection } = useClientNavigationMenus();
  const { user } = useAuth();
  const { mutate: logoutMutate, isPending } = useAuthLogoutMutation({
    mutation: {
      onSuccess: () => {
        resetLayout();
        navigate('/client/login', { replace: true });
      },
      onError: () => {
        resetLayout();
        navigate('/client/login', { replace: true });
      },
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
  const userRoleCode = getClientSidebarRoleCode(user);
  const userRole = getClientUserAuthorityLabel(userRoleCode);

  // AdminSidebar와 동일한 우선순위: 사용자가 선택한 섹션 > 현재 경로의 섹션
  const displayedSection =
    activeSection && menusBySection[activeSection]?.length ? activeSection : currentSection;
  const sectionMenus = displayedSection ? menusBySection[displayedSection] ?? [] : currentMenus;
  // 표시할 섹션이 없는 경우(예: /client/main) 전체 섹션의 메뉴를 펼쳐서 보여준다.
  const displayedMenus = sectionMenus.length > 0 ? sectionMenus : Object.values(menusBySection).flat();

  const sectionLabel = displayedSection && sectionMenus.length > 0 ? (sectionMenus[0]?.label ?? '') : '';

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
      <ClientSidebarHeader />
      {sectionLabel && <SidebarSection label={sectionLabel} />}
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
      <SidebarUser
        userName={userName}
        userRole={userRole}
        onLogout={handleLogoutClick}
        isLoggingOut={isPending}
      />
    </Sidebar>
  );
}
