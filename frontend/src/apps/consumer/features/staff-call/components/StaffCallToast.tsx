import { useState } from 'react';
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

  const [shouldRender, setShouldRender] = useState(called);
  const [isClosing, setIsClosing] = useState(false);
  const [prevCalled, setPrevCalled] = useState(called);

  if (called !== prevCalled) {
    setPrevCalled(called);

    if (called) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setShouldRender(false);
      } else {
        setIsClosing(true);
      }
    }
  }

  if (!shouldRender) return null;

  return (
    <div
      className={`staff-call-toast${isClosing ? ' staff-call-toast--closing' : ''}`}
      role="status"
      onAnimationEnd={() => {
        if (isClosing) setShouldRender(false);
      }}
    >
      <div className="staff-call-toast__icon">
        <ConsumerIcon id="ci-bell" size={15} className="staff-call-toast__icon-bell" />
      </div>
      <div className="staff-call-toast__body">
        <p className="staff-call-toast__title">직원 호출 완료</p>
        <p className="staff-call-toast__desc">{message} · 잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
