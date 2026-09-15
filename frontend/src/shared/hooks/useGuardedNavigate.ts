/**
 * @fileoverview 이탈방지 가드가 적용된 navigate / 커스텀 액션 확인 훅
 *
 * @description
 * `useNavigate()`를 감싸 dirty 상태일 때 이동 전 확인 모달을 거치도록 한다.
 * 로그아웃처럼 navigate가 아닌 액션도 같은 확인 흐름(`requestLeaveConfirm`)으로 처리한다.
 *
 * @remarks
 * - 모달 자체는 호출부(AdminLayout/ClientLayout)에서 `pendingLeaveAction`,
 *   `confirmPendingLeaveAction`, `cancelPendingLeaveAction`을 받아 렌더링한다.
 * - `onNavigate` 콜백은 confirm(또는 dirty가 아니어서 즉시 진행) 시에만 실행되며,
 *   취소 시에는 실행되지 않는다.
 *
 * @example
 * ```ts
 * const { guardedNavigate, requestLeaveConfirm } = useGuardedNavigate();
 *
 * guardedNavigate('/admin/main', undefined, () => {
 *   setActiveSection(null);
 *   closeSidebar();
 * });
 *
 * requestLeaveConfirm({
 *   type: 'custom',
 *   title: '로그아웃하시겠습니까?',
 *   description: '저장하지 않은 내용이 있습니다.\n로그아웃하면 변경사항이 사라집니다.',
 *   confirmLabel: '로그아웃',
 *   onConfirm: () => logoutMutate(),
 * });
 * ```
 */

import type { NavigateOptions, To } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { usePreventLeaveStore, type PendingLeaveAction } from '@/shared/stores/preventLeaveStore';

/**
 * dirty 상태에 따라 이동/커스텀 액션을 즉시 실행하거나 확인 모달 대기시킨다.
 */
export function useGuardedNavigate() {
  const navigate = useNavigate();
  const isDirty = usePreventLeaveStore((s) => s.isDirty);
  const setDirty = usePreventLeaveStore((s) => s.setDirty);
  const pendingLeaveAction = usePreventLeaveStore((s) => s.pendingLeaveAction);
  const setPendingLeaveAction = usePreventLeaveStore((s) => s.setPendingLeaveAction);
  const clearPendingLeaveAction = usePreventLeaveStore((s) => s.clearPendingLeaveAction);

  // 메뉴/홈 이동: dirty가 아니면 즉시 이동 + onNavigate 실행, dirty면 확인 모달 대기
  const guardedNavigate = (to: To, options?: NavigateOptions, onNavigate?: () => void) => {
    if (!isDirty) {
      navigate(to, options);
      onNavigate?.();
      return;
    }

    setPendingLeaveAction({ type: 'navigate', to, options, onNavigate });
  };

  // 로그아웃 등 navigate가 아닌 액션: dirty가 아니면 즉시 실행, dirty면 확인 모달 대기
  const requestLeaveConfirm = (action: Extract<PendingLeaveAction, { type: 'custom' }>) => {
    if (!isDirty) {
      action.onConfirm();
      return;
    }

    setPendingLeaveAction(action);
  };

  // 확인 모달에서 "이동/확인" 클릭 시 보류 중인 액션을 실행
  const confirmPendingLeaveAction = async () => {
    if (!pendingLeaveAction) {
      return;
    }

    if (pendingLeaveAction.type === 'navigate') {
      // 이동 먼저 dirty를 해제해야 가드 없이 navigate가 실행된다
      setDirty(false);
      navigate(pendingLeaveAction.to, pendingLeaveAction.options);
      // 부수효과(섹션 초기화, 사이드바 닫기 등)는 confirm 이후에만 실행
      pendingLeaveAction.onNavigate?.();
    } else {
      await pendingLeaveAction.onConfirm();
    }

    clearPendingLeaveAction();
  };

  // 확인 모달에서 "취소" 클릭 시: 경로/dirty 상태를 그대로 두고 보류 액션만 제거
  const cancelPendingLeaveAction = () => {
    clearPendingLeaveAction();
  };

  return {
    guardedNavigate,
    requestLeaveConfirm,
    pendingLeaveAction,
    confirmPendingLeaveAction,
    cancelPendingLeaveAction,
  };
}
