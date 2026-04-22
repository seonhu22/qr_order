// src/apps/admin/stores/adminLayoutStore.ts

/**
 * @fileoverview 관리자 레이아웃 UI 상태 스토어
 *
 * @description
 * 관리자 전용 사이드바 열림/닫힘 상태만 관리한다.
 * 사이드바 메뉴 펼침 상태는 useSidebarExpand 훅이 담당한다.
 *
 * @example
 * const { isSidebarOpen, toggleSidebar } = useAdminLayoutStore();
 */

import { create } from 'zustand';

type AdminLayoutStore = {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

export const useAdminLayoutStore = create<AdminLayoutStore>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
