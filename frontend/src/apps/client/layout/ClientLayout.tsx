import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '@/apps/client/layout/ClientLayout.css';
import { ClientHeader } from '@/apps/client/features/header/components/ClientHeader';
import { ClientPageNavigation } from '@/apps/client/features/navigation/components/ClientPageNavigation';
import { ClientSidebar } from '@/apps/client/features/sidebar/components/ClientSidebar';
import type { ClientSection } from '@/shared/menu/clientNavigation';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { useClientNavigationMenus } from '@/apps/client/hooks/useClientNavigationMenus';
import { useGuardedNavigate } from '@/shared/hooks/useGuardedNavigate';
import { ConfirmModal } from '@/shared/components/modal/template/ConfirmModal';

export function ClientLayout() {
  const location = useLocation();
  const { guardedNavigate, pendingLeaveAction, confirmPendingLeaveAction, cancelPendingLeaveAction } =
    useGuardedNavigate();
  const isCustomLeaveAction = pendingLeaveAction?.type === 'custom';
  const isSidebarOpen = useClientLayoutStore((s) => s.isSidebarOpen);
  const activeSection = useClientLayoutStore((s) => s.activeSection);
  const openSidebar = useClientLayoutStore((s) => s.openSidebar);
  const closeSidebar = useClientLayoutStore((s) => s.closeSidebar);
  const toggleSidebar = useClientLayoutStore((s) => s.toggleSidebar);
  const setActiveSection = useClientLayoutStore((s) => s.setActiveSection);
  const hideBreadcrumb = useClientLayoutStore((s) => s.hideBreadcrumb);
  const { headerSections, currentSection, breadcrumb } = useClientNavigationMenus();

  useEffect(() => {
    const nextSection = currentSection;
    const storedSection = useClientLayoutStore.getState().activeSection;
    if (nextSection === storedSection) {
      return;
    }

    setActiveSection(nextSection);
    if (nextSection && storedSection === null) {
      openSidebar();
    }
  }, [currentSection, location.pathname, openSidebar, setActiveSection]);

  const handleSectionChange = (section: ClientSection) => {
    setActiveSection(section);
    openSidebar();
  };

  const handleHomeClick = () => {
    guardedNavigate('/client/main', undefined, () => {
      setActiveSection(null);
      closeSidebar();
    });
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
            sections={headerSections}
            isSidebarOpen={isSidebarOpen}
            onSectionChange={handleSectionChange}
            onToggleSidebar={toggleSidebar}
            onHomeClick={handleHomeClick}
          />
        </header>
        <main className="client-layout__main">
          {!hideBreadcrumb && <ClientPageNavigation breadcrumb={breadcrumb} />}
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        open={pendingLeaveAction !== null}
        tone="info"
        title={
          isCustomLeaveAction
            ? pendingLeaveAction.title ?? '확인'
            : '다른 화면으로 이동하시겠습니까?'
        }
        description={
          isCustomLeaveAction
            ? pendingLeaveAction.description
            : '저장하지 않은 내용이 있습니다.\n이동하면 변경사항이 사라집니다.'
        }
        helperText={isCustomLeaveAction ? pendingLeaveAction.helperText : undefined}
        onClose={cancelPendingLeaveAction}
        primaryAction={{
          label: isCustomLeaveAction ? pendingLeaveAction.confirmLabel ?? '확인' : '이동',
          onClick: confirmPendingLeaveAction,
        }}
        secondaryAction={{ onClick: cancelPendingLeaveAction }}
      />
    </div>
  );
}
