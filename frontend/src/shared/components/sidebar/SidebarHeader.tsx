import './SidebarHeader.css';
import type { ReactNode } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';

type SidebarHeaderProps = {
  brand: ReactNode;
  onClose: () => void;
};

export function SidebarHeader({ brand, onClose }: SidebarHeaderProps) {
  return (
    <header className="sidebar-header">
      {brand}
      <button
        type="button"
        className="sidebar-header__close"
        aria-label="사이드바 닫기"
        onClick={onClose}
      >
        <Icon id="i-close" size={16} />
      </button>
    </header>
  );
}
