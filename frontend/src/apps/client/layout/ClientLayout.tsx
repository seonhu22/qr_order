import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import '@/apps/client/layout/ClientLayout.css';
import { ClientHeader } from '@/apps/client/features/header/components/ClientHeader';
import { ClientSidebar } from '@/apps/client/features/sidebar/components/ClientSidebar';
import type { ClientSection } from '@/apps/client/data/clientMenus';

export function ClientLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ClientSection | null>(null);

  const handleSectionChange = (section: ClientSection) => {
    setActiveSection(section);
    setIsSidebarOpen(true);
  };

  const handleHomeClick = () => {
    navigate('/client/main');
    setActiveSection(null);
    setIsSidebarOpen(false);
  };

  return (
    <div className="client-layout">
      {/* ---- 사이드바 ---- */}
      <aside
        className={`client-layout__sidebar${isSidebarOpen ? '' : ' client-layout__sidebar--closed'}`}
        aria-label="사이드 내비게이션"
      >
        <ClientSidebar
          activeSection={activeSection}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* ---- 오른쪽 콘텐츠 래퍼 ---- */}
      <div className="client-layout__content">
        <header className="client-layout__header">
          <ClientHeader
            activeSection={activeSection}
            isSidebarOpen={isSidebarOpen}
            onSectionChange={handleSectionChange}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            onHomeClick={handleHomeClick}
          />
        </header>
        <main className="client-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
