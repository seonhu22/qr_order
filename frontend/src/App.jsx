import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import AppRoutes from '@/shared/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
