import type { ClientNotificationItem } from '../types';

const MAX_READ_IDS = 1000;
export const notificationStorageKey = (userId: string, sysPlantCd: string) =>
  `qr-order:manager-notification-read:${JSON.stringify([userId, sysPlantCd])}`;

export const notificationReadId = (item: ClientNotificationItem) =>
  JSON.stringify([item.kind, item.sysId, item.timestamp]);

export function readNotificationIds(userId: string, sysPlantCd: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(notificationStorageKey(userId, sysPlantCd)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(-MAX_READ_IDS) : [];
  } catch { return []; }
}

export function saveNotificationIds(userId: string, sysPlantCd: string, ids: string[]): void {
  try {
    localStorage.setItem(notificationStorageKey(userId, sysPlantCd), JSON.stringify([...new Set(ids)].slice(-MAX_READ_IDS)));
  } catch { /* 브라우저 저장이 차단되어도 현재 화면의 읽음 처리는 유지한다. */ }
}
