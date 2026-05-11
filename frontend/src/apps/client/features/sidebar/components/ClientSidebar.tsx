import '@/apps/client/features/sidebar/styles/ClientSidebarHeader.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarUser } from '@/shared/components/sidebar';
import { useSidebarExpand } from '@/shared/components/sidebar/useSidebarExpand';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';
import { Icon } from '@/shared/assets/icons/Icon';
import { CLIENT_MENUS_BY_SECTION, type ClientSection } from '@/apps/client/data/clientMenus';

type ClientSidebarProps = {
  activeSection: ClientSection | null;
  onClose: () => void;
};

export function ClientSidebar({ activeSection, onClose }: ClientSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { expandedDepth1Keys, expandedDepth2Keys, toggleDepth1, toggleDepth2 } = useSidebarExpand();

  const menus = activeSection ? (CLIENT_MENUS_BY_SECTION[activeSection] ?? []) : [];
  const sectionLabel = menus[0]?.label ?? '';

  return (
    <Sidebar>
      {/* ---- 헤더 ---- */}
      <div className="client-sidebar-header">
        <ClientBrand />
        <button
          type="button"
          className="client-sidebar-header__close"
          aria-label="사이드바 닫기"
          onClick={onClose}
        >
          <Icon id="i-close" size={16} />
        </button>
      </div>

      {/* ---- 섹션 레이블 ---- */}
      {sectionLabel && (
        <div className="client-sidebar-section">
          <span className="client-sidebar-section__label">{sectionLabel}</span>
        </div>
      )}

      {/* ---- 내비게이션 ---- */}
      <SidebarNav
        menus={menus}
        showDepth1={false}
        expandedDepth1Keys={expandedDepth1Keys}
        expandedDepth2Keys={expandedDepth2Keys}
        currentPathname={location.pathname}
        onToggleDepth1={toggleDepth1}
        onToggleDepth2={toggleDepth2}
        onNavigate={navigate}
      />

      {/* ---- 사용자 푸터 (임시 데이터) ---- */}
      <SidebarUser
        userName="홍길동"
        userRole="매장 관리자"
        onLogout={() => navigate('/client/login')}
      />
    </Sidebar>
  );
}
