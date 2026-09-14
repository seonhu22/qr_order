import { useCallback, useState } from 'react';

/**
 * 취소 카드를 현재 페이지 인스턴스에서만 숨긴다.
 * localStorage와 query cache를 사용하지 않으므로 브라우저 새로고침/재마운트 시 자동 초기화된다.
 */
export function useDismissedOrderIds() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const dismiss = useCallback((id: string) => {
    setDismissedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const isDismissed = useCallback((id: string) => dismissedIds.has(id), [dismissedIds]);

  return { dismissedIds, dismiss, isDismissed };
}
