/**
 * @fileoverview 필터 조회/초기화 dirty guard 훅
 *
 * @description
 * 미저장 편집 상태(dirty)에서 조회·초기화 버튼을 눌렀을 때
 * ConfirmModal을 거치는 흐름을 공통화한다.
 *
 * @remarks
 * - dirty가 아니면 onSearch / onReset을 즉시 실행한다.
 * - dirty라면 pendingFilterAction 상태로 대기하고, confirmFilterAction에서 실행한다.
 * - 모달 컴포넌트는 호출부에서 직접 렌더링하고, 이 훅은 상태와 분기 로직만 담당한다.
 *
 * @example
 * ```ts
 * const {
 *   pendingFilterAction,
 *   requestSearch,
 *   requestReset,
 *   confirmFilterAction,
 *   cancelFilterAction,
 * } = useFilterDirtyCheck({
 *   isDirty,
 *   onSearch: applySearch,
 *   onReset: resetFilters,
 * });
 *
 * // 페이지 JSX (AdminMainLayout 외부)
 * <ConfirmModal
 *   open={pendingFilterAction !== null}
 *   tone="info"
 *   title={pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
 *   description="저장되지 않은 내용이 있습니다."
 *   onClose={cancelFilterAction}
 *   primaryAction={{ onClick: confirmFilterAction }}
 *   secondaryAction={{ onClick: cancelFilterAction }}
 * />
 * ```
 */

import { useState } from 'react';

type UseFilterDirtyCheckParams = {
  isDirty: boolean;
  /** dirty 없이 조회할 때, 또는 dirty 확인 후 진행할 때 호출 */
  onSearch: () => void;
  /** dirty 없이 초기화할 때, 또는 dirty 확인 후 진행할 때 호출 */
  onReset: () => void;
};

/**
 * 조회·초기화 전 dirty 확인 흐름을 관리한다.
 *
 * @returns
 * - `pendingFilterAction` — 대기 중인 액션 ('search' | 'reset' | null)
 * - `requestSearch` — 조회 진입점. dirty면 모달 대기, 아니면 즉시 실행
 * - `requestReset` — 초기화 진입점. dirty면 모달 대기, 아니면 즉시 실행
 * - `confirmFilterAction` — ConfirmModal 확인 핸들러
 * - `cancelFilterAction` — ConfirmModal 닫기 핸들러
 */
export function useFilterDirtyCheck({ isDirty, onSearch, onReset }: UseFilterDirtyCheckParams) {
  const [pendingFilterAction, setPendingFilterAction] = useState<'search' | 'reset' | null>(null);

  const requestSearch = () => {
    if (isDirty) {
      setPendingFilterAction('search');
      return;
    }
    onSearch();
  };

  const requestReset = () => {
    if (isDirty) {
      setPendingFilterAction('reset');
      return;
    }
    onReset();
  };

  const confirmFilterAction = () => {
    if (pendingFilterAction === 'search') onSearch();
    if (pendingFilterAction === 'reset') onReset();
    setPendingFilterAction(null);
  };

  const cancelFilterAction = () => setPendingFilterAction(null);

  return {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  };
}
