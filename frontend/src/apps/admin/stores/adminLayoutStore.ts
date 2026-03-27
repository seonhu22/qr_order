// src/apps/admin/stores/adminLayoutStore.ts

/**
 * @fileoverview 관리자 레이아웃 UI 상태 스토어
 *
 * @description
 * - 관리자 전용 Header/Sidebar의 전역 UI 상태를 관리한다.
 * - 현재 범위는 사이드바 열림/닫힘과 depth1/depth2 메뉴 펼침 상태로 한정한다.
 *
 * @param {never} _unused 이 파일은 Zustand 스토어만 정의한다.
 * @example
 * const { isSidebarOpen, toggleSidebar } = useAdminLayoutStore();
 */

import { create } from 'zustand';

type AdminLayoutStore = {
  isSidebarOpen: boolean;
  expandedDepth1Key: string | null;
  expandedDepth2Key: string | null;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleDepth1: (key: string, hasChildren?: boolean) => void;
  toggleDepth2: (key: string, hasChildren?: boolean) => void;
};

export const useAdminLayoutStore = create<AdminLayoutStore>((set) => ({
  isSidebarOpen: true,
  expandedDepth1Key: 'system',
  expandedDepth2Key: 'systemSettings',
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleDepth1: (key, hasChildren = true) =>
    set((state) => {
      if (!hasChildren) {
        return { expandedDepth1Key: state.expandedDepth1Key };
      }

      const nextDepth1Key = state.expandedDepth1Key === key ? null : key;

      return {
        expandedDepth1Key: nextDepth1Key,
        expandedDepth2Key: nextDepth1Key ? state.expandedDepth2Key : null,
      };
    }),
  toggleDepth2: (key, hasChildren = true) =>
    set((state) => {
      if (!hasChildren) {
        return { expandedDepth2Key: state.expandedDepth2Key };
      }

      return {
        expandedDepth2Key: state.expandedDepth2Key === key ? null : key,
      };
    }),
}));
