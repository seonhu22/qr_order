// src/apps/admin/stores/adminLayoutStore.ts

/**
 * @fileoverview 관리자 레이아웃 UI 상태 스토어
 *
 * @description
 * 사이드바 열림/닫힘 상태와 활성 섹션(시스템/게시판)을 관리한다.
 * 사이드바 메뉴 펼침 상태는 useSidebarExpand 훅이 담당한다.
 *
 * @example
 * const { isSidebarOpen, activeSection, toggleSidebar, setActiveSection } = useAdminLayoutStore();
 */

import { create } from 'zustand';

export type AdminSection = string;

type AdminLayoutStore = {
  isSidebarOpen: boolean;
  /** null = 초기 대시보드 진입 시. 헤더 탭 클릭 전까지 활성 탭 없음. */
  activeSection: AdminSection | null;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveSection: (section: AdminSection | null) => void;
};

export const useAdminLayoutStore = create<AdminLayoutStore>((set) => ({
  isSidebarOpen: false,
  activeSection: null,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
}));
