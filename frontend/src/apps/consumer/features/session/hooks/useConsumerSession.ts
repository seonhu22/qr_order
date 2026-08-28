import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { QrTableInfo } from '@/apps/consumer/features/qr/api/qrConnectApi';
import { fetchConsumerSessionStub, MOCK_STORE_NAME } from '../api/consumerSessionApi';
import type { ConsumerSession, UseConsumerSessionResult } from '../types';

export type QrEntryNavigationState = {
  qrTableInfo?: QrTableInfo;
};

function toConsumerSession(info: QrTableInfo | undefined): ConsumerSession | null {
  if (!info) return null;

  return {
    sysPlantCd: info.sysPlantCd ?? '',
    tableSysId: info.sysId ?? '',
    // 실제 매장명 API가 없어 QR로 들어온 세션도 동일한 임시 매장명을 쓴다.
    storeName: MOCK_STORE_NAME,
    tableName: info.tableName,
    tableNum: info.tableNum,
    tableQty: info.tableQty,
  };
}

/**
 * 현재 Consumer QR 세션을 조회한다.
 *
 * 백엔드 세션 조회 API(GET /api/client/consumer/session)가 없어 아직 새로고침 복구는 되지 않는다.
 * QR 인증 성공 직후 navigate state로 넘어온 테이블 정보가 있으면 그 값으로 세션을 구성하고,
 * 없으면 stub이 3번 테이블 고정값을 돌려준다 — 세션·통신 상태와 무관하게 흐름을 볼 수 있게 하기
 * 위한 것으로, `status`는 지금 항상 'active'다. 'expired'/'closed'/'none' 분기는
 * ConsumerSessionGuard와 함께 실제 세션 API가 붙을 때 다시 의미를 갖는다.
 */
export function useConsumerSession(): UseConsumerSessionResult {
  const location = useLocation();
  const state = location.state as QrEntryNavigationState | null;
  const seed = toConsumerSession(state?.qrTableInfo);

  const { data, isLoading } = useQuery({
    // React Query는 queryKey가 같으면 기존 캐시를 재사용한다. 테이블 ID를 포함해 QR별 세션을 분리하고,
    // QR 경유 정보가 없는 직접 진입은 실제 테이블 캐시와 섞이지 않도록 별도의 stub 키를 사용한다.
    queryKey: [...queryKeys.consumer.session, seed?.tableSysId ?? 'stub'],
    queryFn: () => (seed ? Promise.resolve(seed) : fetchConsumerSessionStub()),
    ...queryPolicies.consumerSession,
  });

  const session = data ?? null;

  return {
    isLoading,
    status: session ? 'active' : 'none',
    session,
  };
}
