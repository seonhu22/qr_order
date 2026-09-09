import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import './StaffCallToast.css';

/**
 * 직원호출 완료 토스트 — 참고 저장소와 같은 문구·타이밍(4초 후 자동 소멸,
 * `consumerStaffCallStore`가 소유). 시트가 닫힌 뒤에도 보여야 해서 ConsumerOrderPage가
 * 다른 전체화면 상태들과 함께 document.body로 포탈한다.
 */
export function StaffCallToast() {
  const called = useConsumerStaffCallStore((state) => state.called);
  const message = useConsumerStaffCallStore((state) => state.message);

  if (!called) return null;

  return (
    <div className="staff-call-toast" role="status">
      <div className="staff-call-toast__icon">
        <ConsumerIcon id="ci-bell" size={15} className="staff-call-toast__icon-bell" />
      </div>
      <div>
        <p className="staff-call-toast__title">직원 호출 완료</p>
        <p className="staff-call-toast__desc">{message} · 잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
