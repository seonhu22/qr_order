// AdminRoutes.jsx
/**
 * 관리자 페이지 라우트 정의
 * - 관리자 페이지는 인증이 필요한 라우트로 구성되어 있습니다.
 * - AppRoutes.jsx에서 RequireAuth 컴포넌트를 통해 보호됩니다.
 */
import { AdminLayout } from '../layout/AdminLayout';
import { MainPage } from '../pages/MainPage';

export const adminRoutes = [
  {
    path: '/dashboard',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        // 예시
        path: 'system/settings/plant',
        element: <></>,
      },
    ],
  },
];
