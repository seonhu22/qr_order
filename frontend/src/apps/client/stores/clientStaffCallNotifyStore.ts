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
  /**
   * 개별 읽음 API가 없어(ADR-036/037) 완료 처리한 호출을 로컬에서만 숨기는 용도.
   * 주문 상태 보드의 "완료"와 헤더 알림 드롭다운이 이 상태를 공유해, 보드에서 완료한 호출이
   * 헤더 배지/목록에서도 같이 사라지게 한다. 새로고침하면 초기화된다.
   */
  dismissedCallIds: Set<string>;
  receive: (event: ClientStaffCallEvent) => void;
  syncUnreadCount: (count: number) => void;
  markRead: () => void;
  dismiss: () => void;
  dismissCall: (id: string) => void;
};

export const useClientStaffCallNotifyStore = create<ClientStaffCallNotifyStore>((set) => ({
  unreadCount: 0,
  latest: null,
  dismissedCallIds: new Set(),
  receive: (event) => set((state) => ({
    unreadCount: state.unreadCount + 1,
    latest: event,
  })),
  syncUnreadCount: (count) => set({ unreadCount: count }),
  markRead: () => set({ unreadCount: 0 }),
  dismiss: () => set({ latest: null }),
  dismissCall: (id) => set((state) => {
    if (state.dismissedCallIds.has(id)) return state;
    return { dismissedCallIds: new Set(state.dismissedCallIds).add(id) };
  }),
}));
