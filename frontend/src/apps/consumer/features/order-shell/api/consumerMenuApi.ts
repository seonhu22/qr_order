import {
  useGetConsumerMenuDetail,
  useGetConsumerMenuMain,
  useSearchConsumerMenu,
} from '@/generated/consumer-menu-controller/consumer-menu-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import {
  mapConsumerMenuDetail,
  mapConsumerMenuMain,
  mapConsumerMenuSearch,
} from './consumerMenuMapper';

export function useConsumerMenuMainQuery(sessionId: string) {
  return useGetConsumerMenuMain({
    query: {
      queryKey: queryKeys.consumer.menuMain(sessionId),
      enabled: Boolean(sessionId),
      select: mapConsumerMenuMain,
      ...queryPolicies.consumerMenu,
    },
  });
}

export function useConsumerMenuSearchQuery(sessionId: string, searchKeyword: string) {
  return useSearchConsumerMenu(
    { searchKeyword },
    {
      query: {
        queryKey: queryKeys.consumer.menuSearch(sessionId, searchKeyword),
        enabled: Boolean(sessionId && searchKeyword),
        select: mapConsumerMenuSearch,
        ...queryPolicies.consumerMenu,
      },
    },
  );
}

export function useConsumerMenuDetailQuery(sessionId: string, menuSysId: string) {
  return useGetConsumerMenuDetail(menuSysId, {
    query: {
      queryKey: queryKeys.consumer.menuDetail(sessionId, menuSysId),
      enabled: Boolean(sessionId && menuSysId),
      select: mapConsumerMenuDetail,
      ...queryPolicies.consumerMenu,
    },
  });
}
