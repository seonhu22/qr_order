import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlantPage from './pages/system/PlantPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="app-loading">로딩 중...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="app-loading">로딩 중...</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <div className="welcome-content">
              <p>좌측 메뉴에서 항목을 선택해주세요.</p>
            </div>
          }
        />
        <Route path="system/settings/plant" element={<PlantPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

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
