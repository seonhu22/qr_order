import { useState } from 'react';
import { CLIENT_NOTIFICATION_MOCK } from '../mock/clientNotificationsMock';
import type { ClientNotificationItem } from '../types';

/**
 * 01 관리자 알림 UI 확인용 임시 훅 — mock 데이터를 로컬 상태로만 들고 있는다.
 * 실데이터 연동 시 동일한 반환 시그니처(items/unseenCount/markItemSeen/markAllSeen)를
 * 유지하는 훅으로 교체하면 ClientHeader/ClientNotificationBell은 수정할 필요가 없다.
 */
export function useManagerNotificationCenterMock() {
  const [items, setItems] = useState<ClientNotificationItem[]>(CLIENT_NOTIFICATION_MOCK);

  const unseenCount = items.filter((item) => !item.seen).length;

  const markItemSeen = (sysId: string) => {
    setItems((current) =>
      current.map((item) => (item.sysId === sysId ? { ...item, seen: true } : item)),
    );
  };

  const markAllSeen = () => {
    setItems((current) => current.map((item) => ({ ...item, seen: true })));
  };

  return { items, unseenCount, markItemSeen, markAllSeen };
}
