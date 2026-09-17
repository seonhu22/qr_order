import { create } from 'zustand';

type ClientStaffCallItem = {
  callCd: string;
  callName: string;
  quantity: number;
};

export type ClientStaffCallEvent = {
  tableSysId: string;
  tableName: string;
  calledAt: string;
  items: ClientStaffCallItem[];
};

type ClientStaffCallNotifyStore = {
  unreadCount: number;
  latest: ClientStaffCallEvent | null;
  receive: (event: ClientStaffCallEvent) => void;
  syncUnreadCount: (count: number) => void;
  markRead: () => void;
  dismiss: () => void;
};

export const useClientStaffCallNotifyStore = create<ClientStaffCallNotifyStore>((set) => ({
  unreadCount: 0,
  latest: null,
  receive: (event) => set((state) => ({
    unreadCount: state.unreadCount + 1,
    latest: event,
  })),
  syncUnreadCount: (count) => set({ unreadCount: count }),
  markRead: () => set({ unreadCount: 0 }),
  dismiss: () => set({ latest: null }),
}));
