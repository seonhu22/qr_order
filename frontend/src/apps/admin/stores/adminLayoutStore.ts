// src/apps/admin/stores/adminLayoutStore.ts

/**
 * @fileoverview 관리자 레이아웃 UI 상태 스토어
 *
 * @description
 * - 관리자 전용 Header/Sidebar의 전역 UI 상태(표시 상태)를 관리한다.
 * - 현재 범위는 사이드바 열림/닫힘과 depth1/depth2 메뉴 펼침 상태로 한정한다.
 *
 * @param {never} _unused 이 파일은 Zustand 스토어만 정의한다.
 * @example
 * const { isSidebarOpen, toggleSidebar } = useAdminLayoutStore();
 */

/**
 * 추후에 권한 별로 메뉴가 바뀌는 경우가 있을 때 Zustand 스토어에서 메뉴 데이터도 관리할 수 있지만,
 * 현재는 UI 상태만 관리하는 것으로 충분하다고 판단하여 메뉴 데이터는 별도의 상수 파일(adminSidebarMenu.ts)로 분리했다.
 */

import { create } from 'zustand';

type AdminLayoutStore = {
  isSidebarOpen: boolean;
  expandedDepth1Key: string | null;
  expandedDepth2Key: string | null;
  setExpandedMenu: (depth1Key: string | null, depth2Key: string | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleDepth1: (key: string, hasChildren?: boolean) => void;
  toggleDepth2: (key: string, hasChildren?: boolean) => void;
};

export const useAdminLayoutStore = create<AdminLayoutStore>((set) => ({
  isSidebarOpen: true,
  expandedDepth1Key: 'system',
  expandedDepth2Key: 'systemManagement',
  setExpandedMenu: (depth1Key, depth2Key) =>
    set({
      expandedDepth1Key: depth1Key,
      expandedDepth2Key: depth2Key,
    }),
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
