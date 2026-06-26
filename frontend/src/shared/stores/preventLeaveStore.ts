// src/shared/stores/preventLeaveStore.ts

/**
 * @fileoverview 이탈방지(미저장 변경 시 이동/로그아웃 경고) 공용 스토어
 *
 * @description
 * 현재 페이지의 dirty 여부와, 이동/로그아웃 등 보류 중인 액션을 관리한다.
 * `usePreventLeave`가 dirty 상태를 동기화하고, `useGuardedNavigate`가
 * pendingLeaveAction을 설정/해소한다. admin/client 공용.
 */

import type { NavigateOptions, To } from 'react-router-dom';
import { create } from 'zustand';

export type PendingLeaveAction =
  | { type: 'navigate'; to: To; options?: NavigateOptions; onNavigate?: () => void }
  | {
      type: 'custom';
      title?: string;
      description: string;
      helperText?: string;
      confirmLabel?: string;
      onConfirm: () => void | Promise<void>;
    }
  | null;

type PreventLeaveStore = {
  /** 현재 mount된 편집 화면에 미저장 변경이 있는지 여부. `usePreventLeave`가 동기화한다. */
  isDirty: boolean;
  /**
   * 확인이 필요해 보류 중인 이동/액션.
   * `useGuardedNavigate`가 설정/해소하고, AdminLayout/ClientLayout의 ConfirmModal이 구독한다.
   */
  pendingLeaveAction: PendingLeaveAction;
  setDirty: (isDirty: boolean) => void;
  setPendingLeaveAction: (action: PendingLeaveAction) => void;
  clearPendingLeaveAction: () => void;
};

export const usePreventLeaveStore = create<PreventLeaveStore>((set) => ({
  isDirty: false,
  pendingLeaveAction: null,
  setDirty: (isDirty) => set({ isDirty }),
  setPendingLeaveAction: (action) => set({ pendingLeaveAction: action }),
  clearPendingLeaveAction: () => set({ pendingLeaveAction: null }),
}));
