import { useEffect, useRef, useState } from 'react';

// 실무에서 흔히 쓰는 "지연 표시 + 최소 유지 시간" 조합값.
// 응답이 SHOW_DELAY_MS보다 빨리 오면 스피너가 한 번도 안 보이고, 한 번 보이고 나면
// MIN_VISIBLE_MS는 무조건 유지한다(뜨자마자 사라지는 역-깜빡임 방지).
const SHOW_DELAY_MS = 300;
const MIN_VISIBLE_MS = 300;

/**
 * isPending을 "보여줄지"로 가공한다. 버튼 disabled 같은 실제 중복 클릭 방지는 isPending을
 * 그대로 쓰고, 이건 스피너 노출 여부만 결정한다.
 */
export function useDelayedPending(isPending: boolean) {
  const [showLoading, setShowLoading] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) {
      const delayTimer = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowLoading(true);
      }, SHOW_DELAY_MS);
      return () => window.clearTimeout(delayTimer);
    }

    // 지연 시간 안에 끝남 — 스피너를 한 번도 보여준 적 없으니 그냥 끝낸다.
    if (shownAtRef.current === null) {
      setShowLoading(false);
      return;
    }

    // 이미 보여주고 있었다면, 최소 유지 시간을 채운 뒤에 끈다.
    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
    const hideTimer = window.setTimeout(() => {
      shownAtRef.current = null;
      setShowLoading(false);
    }, remaining);
    return () => window.clearTimeout(hideTimer);
  }, [isPending]);

  return showLoading;
}
