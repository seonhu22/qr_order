import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import '@/apps/client/layout/ClientLayout.css';
import { ClientHeader } from '@/apps/client/features/header/components/ClientHeader';
import { ClientPageNavigation } from '@/apps/client/features/navigation/components/ClientPageNavigation';
import { ClientSidebar } from '@/apps/client/features/sidebar/components/ClientSidebar';
import {
  findClientMenuBreadcrumb,
  findClientSectionByPath,
  type ClientSection,
} from '@/shared/menu/clientNavigation';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';

export function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSidebarOpen = useClientLayoutStore((s) => s.isSidebarOpen);
  const activeSection = useClientLayoutStore((s) => s.activeSection);
  const openSidebar = useClientLayoutStore((s) => s.openSidebar);
  const closeSidebar = useClientLayoutStore((s) => s.closeSidebar);
  const toggleSidebar = useClientLayoutStore((s) => s.toggleSidebar);
  const setActiveSection = useClientLayoutStore((s) => s.setActiveSection);
  const breadcrumb = findClientMenuBreadcrumb(location.pathname);

  useEffect(() => {
    const nextSection = findClientSectionByPath(location.pathname);
    const currentSection = useClientLayoutStore.getState().activeSection;
    if (nextSection === currentSection) {
      return;
    }

    setActiveSection(nextSection);
    if (nextSection && currentSection === null) {
      openSidebar();
    }
  }, [location.pathname, openSidebar, setActiveSection]);

  const handleSectionChange = (section: ClientSection) => {
    setActiveSection(section);
    openSidebar();
  };

  const handleHomeClick = () => {
    navigate('/client/main');
    setActiveSection(null);
    closeSidebar();
  };

  return (
    <div className="client-layout">
      {/* ---- 사이드바 ---- */}
      <aside
        className={`client-layout__sidebar${isSidebarOpen ? '' : ' client-layout__sidebar--closed'}`}
        aria-label="사이드 내비게이션"
      >
        <ClientSidebar />
      </aside>

      {/* ---- 오른쪽 콘텐츠 래퍼 ---- */}
      <div className="client-layout__content">
        <header className="client-layout__header">
          <ClientHeader
            activeSection={activeSection}
            isSidebarOpen={isSidebarOpen}
            onSectionChange={handleSectionChange}
            onToggleSidebar={toggleSidebar}
            onHomeClick={handleHomeClick}
          />
        </header>
        <main className="client-layout__main">
          <ClientPageNavigation breadcrumb={breadcrumb} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
