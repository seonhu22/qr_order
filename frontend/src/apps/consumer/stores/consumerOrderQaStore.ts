/**
 * @fileoverview QA 전용 — 주문 실패(네트워크·중복)·세션 만료(시간초과·마감)·통신 오류 화면을
 * 미리보기 위한 요청 다리
 *
 * @description
 * 실제 판별 로직이 붙기 전까지, 헤더의 설정 버튼(dev 빌드 한정)에서 상태를 요청하면
 * order-shell(useConsumerOrderPage)이 이를 소비해 해당 화면으로 전환한다.
 * 서로 다른 위치(헤더 ↔ order-shell)라 페이지 로컬 state 대신 스토어로 다리를 놓는다.
 */
import { create } from 'zustand';

export type OrderFailureType = 'network' | 'duplicate';
export type SessionExpiredVariant = 'timeout' | 'closed';

type ConsumerOrderQaStore = {
  pendingOrderFailure: OrderFailureType | null;
  pendingSessionExpiry: SessionExpiredVariant | null;
  pendingNetworkError: boolean;
  requestOrderFailure: (type: OrderFailureType) => void;
  requestSessionExpiry: (variant: SessionExpiredVariant) => void;
  requestNetworkError: () => void;
  clearPendingOrderFailure: () => void;
  clearPendingSessionExpiry: () => void;
  clearPendingNetworkError: () => void;
};

export const useConsumerOrderQaStore = create<ConsumerOrderQaStore>((set) => ({
  pendingOrderFailure: null,
  pendingSessionExpiry: null,
  pendingNetworkError: false,
  requestOrderFailure: (type) => set({ pendingOrderFailure: type }),
  requestSessionExpiry: (variant) => set({ pendingSessionExpiry: variant }),
  requestNetworkError: () => set({ pendingNetworkError: true }),
  clearPendingOrderFailure: () => set({ pendingOrderFailure: null }),
  clearPendingSessionExpiry: () => set({ pendingSessionExpiry: null }),
  clearPendingNetworkError: () => set({ pendingNetworkError: false }),
}));
