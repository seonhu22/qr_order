import { getConsumerSession } from '@/generated/consumer-session-controller/consumer-session-controller';
import type { ConsumerSessionResponse } from '@/generated/types';
import type { ConsumerSession, ConsumerSessionStatus } from '../types';

/** QR 연결 응답에는 매장명이 없어 연결 직후 로딩 화면만 임시 문구를 유지한다. */
export const MOCK_STORE_NAME = '맛나분식';

const STATUS_MAP: Record<
  ConsumerSessionResponse['status'],
  Exclude<ConsumerSessionStatus, 'none' | 'error'>
> = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  EXPIRED: 'expired',
};

export function mapConsumerSession(response: ConsumerSessionResponse): ConsumerSession {
  return {
    consumerSessionId: response.consumerSessionId,
    status: STATUS_MAP[response.status],
    sysPlantCd: response.sysPlantCd,
    storeName: response.storeName,
    tableSysId: response.tableSysId,
    tableName: response.tableName,
    tableNum: response.tableNum,
    tableQty: response.tableQty,
    orderingAllowed: response.orderingAllowed,
    orderingBlockedReason: response.orderingBlockedReason,
    startedAt: response.startedAt,
  };
}

export async function fetchConsumerSession(signal?: AbortSignal): Promise<ConsumerSession> {
  const response = await getConsumerSession(undefined, signal);
  return mapConsumerSession(response.data);
}
