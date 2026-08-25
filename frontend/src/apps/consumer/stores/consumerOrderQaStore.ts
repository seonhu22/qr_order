/**
 * @fileoverview QA 전용 — 주문 실패(네트워크·중복) 화면을 미리보기 위한 요청 다리
 *
 * @description
 * 실제 판별 로직이 붙기 전까지, 헤더의 설정 버튼(dev 빌드 한정)에서 실패 유형을
 * 요청하면 order-shell(useConsumerOrderPage)이 이를 소비해 실패 화면으로 전환한다.
 * 서로 다른 위치(헤더 ↔ order-shell)라 페이지 로컬 state 대신 스토어로 다리를 놓는다.
 */
import { create } from 'zustand';

export type OrderFailureType = 'network' | 'duplicate';

type ConsumerOrderQaStore = {
  pendingOrderFailure: OrderFailureType | null;
  requestOrderFailure: (type: OrderFailureType) => void;
  clearPendingOrderFailure: () => void;
};

export const useConsumerOrderQaStore = create<ConsumerOrderQaStore>((set) => ({
  pendingOrderFailure: null,
  requestOrderFailure: (type) => set({ pendingOrderFailure: type }),
  clearPendingOrderFailure: () => set({ pendingOrderFailure: null }),
}));
