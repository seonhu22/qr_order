// src/apps/admin/features/header/components/AdminHeader.tsx

import '@/apps/admin/features/header/styles/AdminHeader.css';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/shared/assets/icons/Icon';
import { useAdminNavigationMenus } from '@/apps/admin/hooks/useAdminNavigationMenus';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';
import type { AdminSection } from '@/apps/admin/stores/adminLayoutStore';

/**
 * 관리자 레이아웃 상단 헤더
 *
 * - 홈 버튼: 대시보드 이동 + 사이드바 초기화
 * - 상단 내비게이션 탭 (시스템 / 게시판)
 *   · --selected: 현재 사이드바에 열려 있는 섹션
 *   · --current:  현재 URL이 속한 섹션 (실제 페이지 위치)
 */
export function AdminHeader() {
  const navigate = useNavigate();
  const { currentSection, headerSections } = useAdminNavigationMenus();

  const toggleSidebar = useAdminLayoutStore((state) => state.toggleSidebar);
  const closeSidebar = useAdminLayoutStore((state) => state.closeSidebar);
  const openSidebar = useAdminLayoutStore((state) => state.openSidebar);
  const setActiveSection = useAdminLayoutStore((state) => state.setActiveSection);

  const handleHomeClick = () => {
    navigate('/admin/main');
    setActiveSection(null);
    closeSidebar();
  };

  const handleNavClick = (section: AdminSection) => {
    setActiveSection(section);
    openSidebar();
  };

  return (
    <div className="admin-header">
      {currentSection !== null && (
        <button
          type="button"
          className="admin-header__toggle"
          aria-label="메뉴 열기/닫기"
          onClick={toggleSidebar}
        >
          <Icon id="i-menu" size={20} />
        </button>
      )}

      <button
        type="button"
        className="admin-header__home"
        aria-label="대시보드로 이동"
        onClick={handleHomeClick}
      >
        <Icon id="i-home" size={16} />
      </button>

        <div className="admin-header__divider" aria-hidden="true" />

      <nav className="admin-header__nav" aria-label="상단 메뉴">
        {headerSections.map(({ section, label }) => {
          const isCurrent = currentSection === section;
          return (
            <button
              key={section}
              type="button"
              className={`admin-header__nav-item${isCurrent ? ' admin-header__nav-item--current' : ''}`}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => handleNavClick(section)}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
