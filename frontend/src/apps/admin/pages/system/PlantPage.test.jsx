import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlantPage from '@/apps/admin/pages/system/PlantPage';

/**
 * PlantPage 테스트용 QueryClient 래퍼를 생성한다.
 *
 * PlantPage 내부에는 TanStack Query 기반 컴포넌트인 PlantListPreview가 포함되어 있으므로,
 * 페이지를 단독 렌더링하더라도 QueryClientProvider가 필요하다.
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
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe('PlantPage', () => {
  it('renders the page title and the preview list', async () => {
    const { wrapper } = createTestQueryEnvironment();

    render(<PlantPage />, { wrapper });

    expect(screen.getByRole('heading', { name: '사업장 관리' })).toBeInTheDocument();
    expect(await screen.findByText('조회 예시 데이터 3건')).toBeInTheDocument();
  });
});
