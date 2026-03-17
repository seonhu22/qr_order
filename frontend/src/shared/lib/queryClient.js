import { QueryClient } from '@tanstack/react-query';

/**
 * 애플리케이션 전역에서 재사용하는 QueryClient 인스턴스이다.
 *
 * 이 파일에 기본 옵션을 모아두면 화면마다 캐시 정책, 재시도 횟수,
 * 포커스 재조회 같은 동작이 제각각 흩어지는 문제를 줄일 수 있다.
 *
 * 현재 설정 의도는 다음과 같다.
 * - 조회 데이터는 1분 동안 fresh 상태로 본다.
 * - 네트워크 또는 일시 오류에 대해 최대 1회만 재시도한다.
 * - 브라우저 포커스 복귀 시 과도한 자동 재조회는 막는다.
 *
 * @type {QueryClient}
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
