import { create } from 'zustand';

export type ClientStaffCallEvent = {
  tableSysId: string;
  tableName: string;
  items: { callCd: string; callName: string; quantity: number }[];
  calledAt: string;
};

type Store = {
  unreadCount: number;
  latest: ClientStaffCallEvent | null;
  receive: (event: ClientStaffCallEvent) => void;
  markRead: () => void;
  dismiss: () => void;
};

export const useClientStaffCallNotifyStore = create<Store>((set) => ({
  unreadCount: 0,
  latest: null,
  receive: (event) => set((state) => ({ unreadCount: state.unreadCount + 1, latest: event })),
  markRead: () => set({ unreadCount: 0 }),
  dismiss: () => set({ latest: null }),
}));
