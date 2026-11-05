import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { AuthRedirectHandler } from '@/shared/auth/AuthRedirectHandler';
import { queryClient } from '@/shared/lib/queryClient';
import AppRoutes from '@/shared/routes/AppRoutes';
import { AppLoadingScreen } from '@/shared/components/loading';
import { RouteLoadErrorBoundary } from '@/shared/routes/RouteLoadErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthRedirectHandler />
          <RouteLoadErrorBoundary>
            <Suspense fallback={<AppLoadingScreen message="화면을 불러오는 중..." />}>
              <AppRoutes />
            </Suspense>
          </RouteLoadErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
