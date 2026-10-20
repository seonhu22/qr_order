/**
 * @fileoverview 보드에서 빠지는 카드를 페이드아웃으로 치우는 훅
 *
 * @description
 * 원래는 높이/마진까지 접으면서 형제 카드가 자리로 미끄러져 올라오게(FLIP) 했는데, 카드가
 * 여러 장일 때 그 복잡도(위치 측정 → 흐름에서 빼기 → 형제 전부 transform 보정) 자체가
 * 버벅임의 원인이 돼서 더 단순한 방식으로 낮췄다. 지금은 카드가 자기 자리에서 페이드아웃만
 * 하고, 끝나면 onExited로 실제 행을 치운다 — 그 다음 재배치는 애니메이션 없이 즉시 일어난다.
 */

import { useEffect, useRef } from 'react';

const FADE_MS = 400;

export function useFadeOutExit(isLeaving: boolean | undefined, onExited?: () => void) {
  const ref = useRef<HTMLElement>(null);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useEffect(() => {
    if (!isLeaving) return;

    const el = ref.current;
    if (!el) {
      onExitedRef.current?.();
      return;
    }

    let cancelled = false;

    // 직전에 우리가 만든 페이드 애니메이션이 아직 안 끝났다면 정리한다. CSSAnimation(예: 상태
    // 변경 시 도는 "방금 이동됨" 주황 강조, order-status-card-flash)은 건드리지 않는다 —
    // 전부 취소하면 카드가 사라지기 시작하는 순간 그 강조가 뚝 끊겨 보인다.
    el.getAnimations()
      .filter((animation) => !(animation instanceof CSSAnimation))
      .forEach((animation) => animation.cancel());

    el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: FADE_MS, easing: 'ease-in', fill: 'forwards' },
    )
      .finished.then(() => {
        if (!cancelled) onExitedRef.current?.();
      })
      .catch(() => {
        if (!cancelled) onExitedRef.current?.();
      });

    return () => {
      cancelled = true;
    };
  }, [isLeaving]);

  return ref;
}
