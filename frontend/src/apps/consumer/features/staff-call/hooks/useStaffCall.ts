import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConsumerStaffCallStore } from '@/apps/consumer/stores/consumerStaffCallStore';
import { callStaff, fetchStaffCallSettings } from '../api/staffCallApi';

export function useStaffCall() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const notifyCalled = useConsumerStaffCallStore((state) => state.notifyCalled);
  const settingsQuery = useQuery({
    queryKey: ['consumer', 'staff-call-settings'],
    queryFn: ({ signal }) => fetchStaffCallSettings(signal),
    staleTime: 60_000,
  });
  const items = (settingsQuery.data ?? []).map((setting) => ({
    id: setting.callCd,
    label: setting.callNm,
    showQty: setting.singleYn !== 'Y',
  }));

  function toggleItem(id: string, showQty: boolean) {
    setSubmitError(null);
    setActiveIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
        if (showQty) setItemQty(({ [id]: _removed, ...rest }) => rest);
      } else {
        next.add(id);
        if (showQty) setItemQty((quantity) => ({ ...quantity, [id]: 1 }));
      }
      return next;
    });
  }

  function changeQty(id: string, delta: number) {
    setItemQty((previous) => {
      const next = (previous[id] ?? 1) + delta;
      if (next <= 0) {
        setActiveIds((ids) => new Set([...ids].filter((value) => value !== id)));
        const { [id]: _removed, ...rest } = previous;
        return rest;
      }
      return { ...previous, [id]: Math.min(next, 99) };
    });
  }

  const activeItems = items.filter((item) => activeIds.has(item.id));
  const hasAny = activeItems.length > 0;
  const buildSummary = () => activeItems.map((item) => {
    const quantity = itemQty[item.id] ?? 1;
    return item.showQty && quantity > 1 ? `${item.label} ${quantity}개` : item.label;
  }).join(', ');

  async function confirmCall() {
    const summary = buildSummary();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await callStaff(activeItems.map((item) => ({
        callCd: item.id,
        quantity: itemQty[item.id] ?? 1,
      })));
      notifyCalled(summary);
      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '직원 호출에 실패했습니다.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    items, activeIds, itemQty, activeItems, hasAny, isSubmitting, submitError,
    isLoading: settingsQuery.isLoading, loadError: settingsQuery.error,
    toggleItem, changeQty, confirmCall,
  };
}
