/**
 * @fileoverview Consumer 주문내역(완료된 주문 목록) 공유 상태
 *
 * @description
 * ConsumerHeader(주문내역 버튼 배지)와 order-shell(useConsumerOrderPage, 주문 완료 시 기록)이
 * 서로 다른 위치에서 같은 데이터를 읽고 써야 해서 페이지 로컬 state 대신 스토어로 공유한다.
 * 장바구니와 마찬가지로 이번 PR엔 영속되지 않는 mock — 새로고침하면 비워진다.
 */
import { create } from 'zustand';
import type { OrderShellOrderRecord } from '@/apps/consumer/features/order-shell/types';

type ConsumerOrderHistoryStore = {
  orders: OrderShellOrderRecord[];
  addOrder: (order: OrderShellOrderRecord) => void;
  /** QA 전용 — 새로고침 없이 주문내역을 다시 빈 상태부터 확인할 수 있게 헤더 설정 메뉴에서 부른다. */
  clearOrders: () => void;
};

export const useConsumerOrderHistoryStore = create<ConsumerOrderHistoryStore>((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  clearOrders: () => set({ orders: [] }),
}));
