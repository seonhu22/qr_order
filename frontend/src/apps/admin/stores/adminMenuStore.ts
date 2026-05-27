import { create } from 'zustand';

type AdminMenuStore = {
  currentMenuCd: string | undefined;
  currentPath: string;
  setCurrentMenu: (menuCd: string | undefined, path: string) => void;
  clearCurrentMenu: () => void;
};

export const useAdminMenuStore = create<AdminMenuStore>((set) => ({
  currentMenuCd: undefined,
  currentPath: '',
  setCurrentMenu: (menuCd, path) => set({ currentMenuCd: menuCd, currentPath: path }),
  clearCurrentMenu: () => set({ currentMenuCd: undefined, currentPath: '' }),
}));
