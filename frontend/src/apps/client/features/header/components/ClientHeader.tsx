import '@/apps/client/features/header/styles/ClientHeader.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { ClientSection } from '@/shared/menu/clientNavigation';

type ClientHeaderProps = {
  activeSection: ClientSection | null;
  sections: { key: ClientSection; label: string }[];
  isSidebarOpen: boolean;
  onSectionChange: (section: ClientSection) => void;
  onToggleSidebar: () => void;
  onHomeClick: () => void;
};

export function ClientHeader({
  activeSection,
  sections,
  isSidebarOpen,
  onSectionChange,
  onToggleSidebar,
  onHomeClick,
}: ClientHeaderProps) {
  return (
    <div className="client-header">
      {activeSection !== null && (
        <button
          type="button"
          className="client-header__toggle"
          aria-label="메뉴 열기/닫기"
          aria-expanded={isSidebarOpen}
          onClick={onToggleSidebar}
        >
          <Icon id="i-menu" size={20} />
        </button>
      )}

      <button
        type="button"
        className="client-header__home"
        aria-label="대시보드로 이동"
        onClick={onHomeClick}
      >
        <Icon id="i-home" size={16} />
      </button>

      <div className="client-header__divider" aria-hidden="true" />

      <nav className="client-header__nav" aria-label="상단 메뉴">
        {sections.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`client-header__nav-item${activeSection === key ? ' client-header__nav-item--current' : ''}`}
            aria-current={activeSection === key ? 'page' : undefined}
            onClick={() => onSectionChange(key)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
