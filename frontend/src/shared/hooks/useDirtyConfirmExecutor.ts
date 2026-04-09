/**
 * @fileoverview dirty 상태 확인 후 액션 실행 공용 훅
 *
 * @description
 * - "저장되지 않은 내용이 있습니다" 같은 확인 흐름을 공통화한다.
 * - UI 모달 구현은 호출부가 담당하고, 이 훅은 실행 분기만 담당한다.
 *
 * @remarks
 * 이 훅은 모달 컴포넌트를 직접 렌더링하지 않는다.
 * 대신 "dirty일 때 확인 모달을 열어달라"는 콜백 계약만 제공한다.
 * 따라서 CommonCode, AdminUser 같은 CRUD 화면에서 도메인 문구를 유지하면서
 * 실행 분기 로직만 재사용할 수 있다.
 */

type DirtyConfirmModalState = {
  description: string;
  helperText?: string;
  onConfirm?: () => void | Promise<void>;
};

type UseDirtyConfirmExecutorParams = {
  isDirty: boolean;
  openDirtyConfirm: (state: DirtyConfirmModalState) => void;
};

type RunWithDirtyConfirmParams = {
  description: string;
  helperText?: string;
  onProceed: () => void | Promise<void>;
};

/**
 * dirty 여부에 따라 즉시 실행/확인 모달 실행을 분기한다.
 *
 * @param {UseDirtyConfirmExecutorParams} params
 * @returns {{ runWithDirtyConfirm: (params: RunWithDirtyConfirmParams) => boolean }}
 *
 * @example
 * ```ts
 * const { runWithDirtyConfirm } = useDirtyConfirmExecutor({
 *   isDirty,
 *   openDirtyConfirm: (state) => setSimpleModalState(state),
 * });
 *
 * const requestSearch = () => {
 *   const blocked = runWithDirtyConfirm({
 *     description: '조회하시겠습니까?',
 *     helperText: '저장되지 않은 내용이 있습니다.',
 *     onProceed: () => {
 *       applyDraftKeyword();
 *       resetDraftRows();
 *     },
 *   });
 *
 *   if (blocked) return;
 * };
 * ```
 *
 * @example
 * ```ts
 * // 반환값 의미
 * // true  -> dirty라서 확인 모달을 연 상태 (즉시 실행 안 함)
 * // false -> dirty가 아니라 onProceed를 즉시 실행한 상태
 * ```
 */
export function useDirtyConfirmExecutor({
  isDirty,
  openDirtyConfirm,
}: UseDirtyConfirmExecutorParams) {
  /**
   * 실행 함수.
   *
   * @description
   * - dirty가 아니면 `onProceed`를 즉시 실행한다.
   * - dirty면 onProceed를 모달의 onConfirm으로 넘기고 즉시 실행은 중단한다.
   */
  const runWithDirtyConfirm = ({ description, helperText, onProceed }: RunWithDirtyConfirmParams) => {
    if (!isDirty) {
      void onProceed();
      return false;
    }

    openDirtyConfirm({
      description,
      helperText,
      onConfirm: onProceed,
    });
    return true;
  };

  return {
    runWithDirtyConfirm,
  };
}
