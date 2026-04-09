import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { queryClient } from '@/shared/lib/queryClient';
import AppRoutes from '@/shared/routes/AppRoutes';

function App() {
  return (
    // BrowserRouter는 라우팅을 위한 컴포넌트입니다.
    // 앱 전체를 감싸서 라우팅 기능을 제공합니다.
    <BrowserRouter>
      {/* QueryClientProvider는 React Query를 위한 컨텍스트를 제공합니다. */}
      {/* 이 Provider가 있어야 useQuery, useMutation, useQueryClient 등 훅을 사용할 수 있다. 이건 작성법이다.*/}
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider는 인증 상태를 관리하는 컨텍스트를 제공합니다. */}
        <AuthProvider>
          {/* AppRoutes는 라우팅 설정을 담당하는 컴포넌트입니다. */}
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
