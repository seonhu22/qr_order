import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { AuthRedirectHandler } from '@/shared/auth/AuthRedirectHandler';
import { queryClient } from '@/shared/lib/queryClient';
import AppRoutes from '@/shared/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthRedirectHandler />
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
