/**
 * @fileoverview Consumer 하단 시트(메뉴상세/장바구니/주문내역/직원호출) 공유 상태
 *
 * @description
 * ConsumerHeader(직원호출·주문내역 버튼)와 order-shell(메뉴상세·장바구니 트리거)처럼
 * 서로 다른 위치에서 같은 시트를 열어야 해서 페이지 로컬 state 대신 스토어로 공유한다.
 * 실제 시트 내용 렌더링은 order-shell이 담당한다.
 */
import { create } from 'zustand';

export type ConsumerSheetState =
  | { type: 'menu-detail'; menuId: string }
  | { type: 'cart' }
  | { type: 'order-history' }
  | { type: 'staff-call' }
  | null;

type OpenableConsumerSheet = Exclude<ConsumerSheetState, null>;

type ConsumerSheetStore = {
  sheet: ConsumerSheetState;
  openSheet: (sheet: OpenableConsumerSheet) => void;
  closeSheet: () => void;
};

export const useConsumerSheetStore = create<ConsumerSheetStore>((set) => ({
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
}));
