import { create } from 'zustand';

type ClientSseConnectionStore = {
  degraded: boolean;
  setDegraded: (degraded: boolean) => void;
};

export const useClientSseConnectionStore = create<ClientSseConnectionStore>((set) => ({
  degraded: false,
  setDegraded: (degraded) => set({ degraded }),
}));
