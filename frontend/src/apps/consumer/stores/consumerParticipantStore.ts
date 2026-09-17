import { create } from 'zustand';

type ConsumerParticipantState = {
  count: number;
  setCount: (count: number) => void;
  reset: () => void;
};

export const useConsumerParticipantStore = create<ConsumerParticipantState>((set) => ({
  count: 1,
  setCount: (count) => set({ count: Math.max(1, Math.trunc(count)) }),
  reset: () => set({ count: 1 }),
}));
