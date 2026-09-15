import { useState } from 'react';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import { callStaffStub } from '../api/staffCallApi';
import { STAFF_CALL_ITEMS } from '../mock/staffCallItems';

/**
 * 직원호출 시트의 항목별 on/off·수량·범용 호출 토글 상태를 소유한다. 참고 저장소의
 * `StaffCallSheet` 로컬 state와 동일한 계약이며, 시트가 닫혔다 다시 열리면 컴포넌트가 새로
 * 마운트되어 초기화된다 — 별도의 리셋 로직이 필요 없다.
 *
 * on/off 진실값은 `activeIds`가 갖는다 — `showQty: false` 아이템은 수량 개념이 없어
 * `itemQty`만으로는 on 상태를 표현할 수 없기 때문이다(ADR-033).
 */
export function useStaffCall() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [staffToggle, setStaffToggle] = useState(false);
  const notifyCalled = useConsumerStaffCallStore((state) => state.notifyCalled);

  /** 칩 클릭 — 모든 아이템 공통 on/off 토글. showQty 아이템만 수량을 같이 켜고/끈다. */
  function toggleItem(id: string, showQty: boolean) {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (showQty) {
          setItemQty((qtyPrev) => {
            const { [id]: _removed, ...rest } = qtyPrev;
            return rest;
          });
        }
      } else {
        next.add(id);
        if (showQty) {
          setItemQty((qtyPrev) => ({ ...qtyPrev, [id]: 1 }));
        }
      }
      return next;
    });
  }

  /** 리스트 내부 수량 조절(showQty 아이템 전용) — 0 이하로 내려가면 칩도 같이 off된다. */
  function changeQty(id: string, delta: number) {
    setItemQty((prev) => {
      const next = (prev[id] ?? 1) + delta;
      if (next <= 0) {
        setActiveIds((idsPrev) => {
          const nextIds = new Set(idsPrev);
          nextIds.delete(id);
          return nextIds;
        });
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }

  function toggleStaffCall() {
    setStaffToggle((prev) => !prev);
  }

  const activeItems = STAFF_CALL_ITEMS.filter((item) => activeIds.has(item.id));
  const hasAny = activeItems.length > 0 || staffToggle;

  /** "직원호출, 소스추가"처럼 토글·항목을 하나의 요약 문자열로 합친다. showQty 아이템만 수량을 붙인다. */
  function buildSummary() {
    const parts: string[] = [];
    if (staffToggle) parts.push('직원호출');
    activeItems.forEach((item) => {
      if (item.showQty) {
        const qty = itemQty[item.id] ?? 1;
        parts.push(qty > 1 ? `${item.label} ${qty}개` : item.label);
      } else {
        parts.push(item.label);
      }
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
    activeIds,
    itemQty,
    staffToggle,
    activeItems,
    hasAny,
    toggleItem,
    changeQty,
    toggleStaffCall,
    confirmCall,
  };
}
