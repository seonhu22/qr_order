import type { OrderStatusKey } from '@/shared/order-status/statusMeta';

/**
 * 손님(consumer) API가 문자열로 내려주는 주문 상태를 shared canonical 키로 정규화한다.
 * MVP 시점 응답에는 `RECEIVED`만 확정돼 있고 나머지 코드는 백엔드 확장 시 채워지므로,
 * 미지원 코드는 `null`을 반환해 배지를 렌더하지 않도록 한다(라벨 없이 raw 문자열이
 * 노출되는 것보다 낫다는 판단이다).
 */
const RAW_TO_KEY: Partial<Record<string, OrderStatusKey>> = {
  RECEIVED: 'RECEIVED',
  PREPARING: 'COOKING',
  COOKING: 'COOKING',
  SERVED: 'SERVED',
  CANCELED: 'CANCELLED',
  CANCELLED: 'CANCELLED',
};

export function normalizeConsumerOrderStatus(raw: string): OrderStatusKey | null {
  return RAW_TO_KEY[raw] ?? null;
}
