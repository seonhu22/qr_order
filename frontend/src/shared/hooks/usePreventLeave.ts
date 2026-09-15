/**
 * @fileoverview 이탈방지(미저장 변경 시 이동/새로고침 경고) 훅
 *
 * @description
 * 페이지의 dirty 상태를 `preventLeaveStore`에 동기화하고,
 * dirty인 동안 새로고침/탭·창 닫기를 `beforeunload`로 경고한다.
 *
 * @remarks
 * - 메뉴 이동/로그아웃 가드는 `useGuardedNavigate`가 담당한다.
 * - 현재 라우팅 구조상 한 시점에 하나의 편집 화면만 mount되는
 *   단일 dirty-source 전제로 동작한다. unmount 시 dirty를 false로 되돌린다.
 *
 * @example
 * ```ts
 * const isDirty = useMemo(() => hasChanges(draft, base), [draft, base]);
 * usePreventLeave(isDirty);
 * ```
 */

import { useEffect } from 'react';
import { usePreventLeaveStore } from '@/shared/stores/preventLeaveStore';

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = '';
};

/**
 * dirty 상태를 공용 스토어에 동기화하고 새로고침/탭 닫기를 경고한다.
 */
export function usePreventLeave(isDirty: boolean) {
  const setDirty = usePreventLeaveStore((s) => s.setDirty);

  // 메뉴 이동/로그아웃 가드(useGuardedNavigate)가 참조할 dirty 상태를 스토어에 동기화
  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  // dirty일 때만 새로고침/탭·창 닫기 시 브라우저 기본 확인창을 띄운다
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 화면 unmount 시 dirty 상태를 남기지 않도록 초기화 (단일 dirty-source 전제)
  useEffect(() => {
    return () => setDirty(false);
  }, [setDirty]);
}
