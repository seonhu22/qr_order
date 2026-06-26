/**
 * @fileoverview 점주용 Client 레이아웃 UI 상태 스토어
 *
 * @description
 * 사이드바 열림/닫힘 상태와 활성 상단 섹션을 관리한다.
 * 메뉴 펼침 상태는 공용 useSidebarExpand 훅이 담당한다.
 */

import { create } from 'zustand';
import type { ClientSection } from '@/shared/menu/clientNavigation';

type ClientLayoutStore = {
  isSidebarOpen: boolean;
  activeSection: ClientSection | null;
  hideBreadcrumb: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveSection: (section: ClientSection | null) => void;
  setHideBreadcrumb: (hide: boolean) => void;
};

export const useClientLayoutStore = create<ClientLayoutStore>((set) => ({
  isSidebarOpen: false,
  activeSection: null,
  hideBreadcrumb: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setHideBreadcrumb: (hide) => set({ hideBreadcrumb: hide }),
}));
