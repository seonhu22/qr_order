export const staleTimes = {
  instant: 0,
  short: 1000 * 60,
  normal: 1000 * 60 * 5,
  session: 1000 * 60 * 30,
} as const;

export const queryPolicies = {
  adminCrudList: {
    staleTime: staleTimes.short,
  },
  // Phase 2 예약: 클라이언트 앱 React Query 도입 시 사용. 현재 호출처 없음.
  clientCrudList: {
    staleTime: staleTimes.short,
  },
  clientReferenceData: {
    staleTime: staleTimes.normal,
  },
  clientRealtimeStatus: {
    staleTime: staleTimes.instant,
  },
  // staleTime: 0이라도 같은 query key로 setState만 다시 부르면 refetch가 발동하지 않는다.
  // 이 정책을 채택하는 화면은 "조회 버튼 누름 = 같은 조건이면 refetch() 직접 호출"을 함께 구현한다.
  // 적용 예: useAccessLogPageState, useChangeHistoryPageState (areQueryParamsEqual + refetch 패턴)
  searchResult: {
    staleTime: staleTimes.instant,
  },
  authMe: {
    retry: false,
    staleTime: staleTimes.session,
  },
  // retry: false는 의도된 선택이다. 대시보드는 페이지 진입 시 즉시 표시되어야 하므로
  // 일시 장애 시 재시도로 지연되기보다 에러 UI를 빠르게 노출해 사용자가 새로고침으로 복구하도록 한다.
  dashboard: {
    retry: false,
    staleTime: staleTimes.short,
  },
} as const;
