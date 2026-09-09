/**
 * @fileoverview 직원호출 "최근 호출됨" 표시 공유 상태
 *
 * @description
 * 참고 저장소의 `staffCalled`/`staffCallMsg`와 같은 역할 — 헤더의 "직원호출" 버튼(벨 바운스 +
 * 채워진 스타일)과 화면 하단 토스트가 같은 상태를 봐야 해서 스토어로 공유한다.
 * 호출 후 일정 시간이 지나면 자동으로 꺼진다.
 */
import { create } from 'zustand';

const CALLED_HIGHLIGHT_MS = 4000;

type ConsumerStaffCallStore = {
  called: boolean;
  message: string;
  notifyCalled: (summary: string) => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useConsumerStaffCallStore = create<ConsumerStaffCallStore>((set) => ({
  called: false,
  message: '',
  notifyCalled: (summary) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ called: true, message: summary });
    hideTimer = setTimeout(() => set({ called: false }), CALLED_HIGHLIGHT_MS);
  },
}));
