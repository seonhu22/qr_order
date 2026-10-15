import { useEffect, useRef, useState } from 'react';
import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import './StaffCallToast.css';

/**
 * 직원호출 완료 토스트 — 참고 저장소와 같은 문구·타이밍(4초 후 자동 소멸,
 * `consumerStaffCallStore`가 소유). 시트가 닫힌 뒤에도 보여야 해서 ConsumerOrderPage가
 * 다른 전체화면 상태들과 함께 document.body로 포탈한다.
 *
 * 사라질 때도 참고 저장소처럼 위로 살짝 뜨며 페이드아웃한다 — `ConsumerBottomSheet`와 같은
 * "닫힘 애니메이션이 끝날 때까지 렌더 유지" 패턴(effect가 아니라 렌더 중 prop 변경 감지)을 쓴다.
 */
export function StaffCallToast() {
  const called = useConsumerStaffCallStore((state) => state.called);
  const message = useConsumerStaffCallStore((state) => state.message);
  const dismiss = useConsumerStaffCallStore((state) => state.dismiss);

  const [shouldRender, setShouldRender] = useState(called);
  const [isClosing, setIsClosing] = useState(false);
  const [prevCalled, setPrevCalled] = useState(called);

  const toastRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 토스트는 뜰 때 포커스를 뺏지 않는(수동적 알림) 대신, 뜬 시점의 포커스를 기록해 둔다 —
  // 사용자가 직접 닫기 버튼에 Tab으로 들어온 채 자동 소멸되면 그 기록으로 포커스를 되돌리기 위함
  // (ConsumerBottomSheet와 같은 복원 기법, 다만 토스트는 애초에 포커스를 가둬두지 않아 조건부로만 복원한다).
  useEffect(() => {
    if (shouldRender) {
      previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, [shouldRender]);

  const closeToast = () => {
    if (toastRef.current?.contains(document.activeElement)) {
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    }
    setShouldRender(false);
  };

  if (called !== prevCalled) {
    setPrevCalled(called);

    if (called) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        closeToast();
      } else {
        setIsClosing(true);
      }
    }
  }

  if (!shouldRender) return null;

  return (
    <div
      ref={toastRef}
      className={`staff-call-toast${isClosing ? ' staff-call-toast--closing' : ''}`}
      role="status"
      onAnimationEnd={() => {
        if (isClosing) closeToast();
      }}
    >
      <div className="staff-call-toast__icon">
        <ConsumerIcon id="ci-bell" size={15} className="staff-call-toast__icon-bell" />
      </div>
      <div className="staff-call-toast__body">
        <p className="staff-call-toast__title">직원 호출 완료</p>
        <p className="staff-call-toast__desc">{message} · 잠시만 기다려 주세요</p>
      </div>
      <button type="button" className="staff-call-toast__close" onClick={dismiss} aria-label="알림 닫기">
        <ConsumerIcon id="ci-x" size={14} />
      </button>
    </div>
  );
}
