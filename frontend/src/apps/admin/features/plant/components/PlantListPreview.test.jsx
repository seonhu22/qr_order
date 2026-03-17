import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import PlantListPreview from '@/apps/admin/features/plant/components/PlantListPreview';
import { server } from '@/test/server';

// * createTestQueryEnvironment 함수는 각 테스트마다 새로운 QueryClient와 QueryClientProvider를 생성하여 반환합니다.
/**
 * * 테스트마다 새로운 QueryClient를 생성한다.
 *
 * QueryClient는 캐시를 메모리에 유지하므로,
 * 테스트 간 캐시 공유가 생기면 앞선 테스트 결과가 다음 테스트에 영향을 줄 수 있다.
 * 따라서 각 테스트는 독립적인 QueryClientProvider 환경에서 렌더링해야 한다.
 *
 * @returns {{client: QueryClient, wrapper: ({children: import('react').ReactNode}) => JSX.Element}}
 */
function createTestQueryEnvironment() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    client,
    // wrapper은 React Testing Library의 render 함수에서 사용할 수 있는 옵션입니다.
    // 이 wrapper는 테스트 컴포넌트를 QueryClientProvider로 감싸서 렌더링할 수 있게 해줍니다.
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

// * describe와 it 블록은 Vitest에서 테스트 스위트와 테스트 케이스를 정의하는 함수입니다.

// describe 블록은 테스트 스위트(테스트 그룹)를 정의합니다. PlantListPreview 컴포넌트에 대한 테스트를 그룹화합니다.
describe('PlantListPreview', () => {
  // it 블록은 개별 테스트 케이스를 정의합니다.
  // 첫 번째 테스트는 API에서 사업장 목록을 성공적으로 가져오는 경우를 검증합니다.
  it('API에서 가져온 사업장 목록을 렌더링한다', async () => {
    const { wrapper } = createTestQueryEnvironment();

    render(<PlantListPreview />, { wrapper });

    expect(await screen.findByText('조회 예시 데이터 3건')).toBeInTheDocument();
    expect(screen.getByText(/서울점 \(SEOUL\) \/ 사용여부: Y/)).toBeInTheDocument();
    expect(screen.getByText(/부산점 \(BUSAN\) \/ 사용여부: Y/)).toBeInTheDocument();
    expect(screen.getByText(/제주점 \(JEJU\) \/ 사용여부: N/)).toBeInTheDocument();
  });

  // it 블록은 개별 테스트 케이스를 정의합니다.
  // 두 번째 테스트는 API에서 사업장 목록이 없을 때를 검증합니다.
  it('API에서 사업장 목록이 없을 때 빈 상태를 렌더링한다', async () => {
    const { wrapper } = createTestQueryEnvironment();

    server.use(
      http.get('/api/system/settings/plant/search', () => {
        return HttpResponse.json([]);
      }),
    );

    render(<PlantListPreview />, { wrapper });

    expect(await screen.findByText('표시할 사업장 데이터가 없습니다.')).toBeInTheDocument();
  });

  it('API 요청이 실패할 때 에러 상태를 렌더링한다', async () => {
    const { wrapper } = createTestQueryEnvironment();

    // API 요청이 실패하는 시나리오를 시뮬레이션하기 위해 MSW 핸들러를 재정의합니다.
    server.use(
      http.get('/api/system/settings/plant/search', () => {
        return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
      }),
    );

    render(<PlantListPreview />, { wrapper });

    expect(await screen.findByText('사업장 목록을 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 조회' })).toBeInTheDocument();
  });
});
