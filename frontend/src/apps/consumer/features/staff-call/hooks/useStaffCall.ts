import { useState } from 'react';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import { callStaffStub } from '../api/staffCallApi';
import { STAFF_CALL_ITEMS } from '../mock/staffCallItems';

/**
 * 직원호출 시트의 항목별 수량·범용 호출 토글 상태를 소유한다. 참고 저장소의
 * `StaffCallSheet` 로컬 state와 동일한 계약이며, 시트가 닫혔다 다시 열리면 컴포넌트가 새로
 * 마운트되어 초기화된다 — 별도의 리셋 로직이 필요 없다.
 */
export function useStaffCall() {
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [staffToggle, setStaffToggle] = useState(false);
  const notifyCalled = useConsumerStaffCallStore((state) => state.notifyCalled);

  function addItem(id: string) {
    setItemQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function changeQty(id: string, delta: number) {
    setItemQty((prev) => {
      const next = (prev[id] ?? 0) + delta;
      if (next <= 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }

  function toggleStaffCall() {
    setStaffToggle((prev) => !prev);
  }

  const selectedItems = STAFF_CALL_ITEMS.filter((item) => (itemQty[item.id] ?? 0) > 0);
  const hasAny = selectedItems.length > 0 || staffToggle;

  /** "직원호출, 소스추가 2개"처럼 토글·항목을 하나의 요약 문자열로 합친다. */
  function buildSummary() {
    const parts: string[] = [];
    if (staffToggle) parts.push('직원호출');
    selectedItems.forEach((item) => {
      const qty = itemQty[item.id];
      parts.push(qty > 1 ? `${item.label} ${qty}개` : item.label);
    });
    return parts.join(', ');
  }

  function confirmCall() {
    const summary = buildSummary();
    void callStaffStub(summary);
    notifyCalled(summary);
  }

  return {
    items: STAFF_CALL_ITEMS,
    itemQty,
    staffToggle,
    selectedItems,
    hasAny,
    addItem,
    changeQty,
    toggleStaffCall,
    confirmCall,
  };
}
