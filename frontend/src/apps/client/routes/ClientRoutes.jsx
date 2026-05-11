import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { MainPage } from '@/apps/client/pages/main/MainPage';

export const clientRoutes = [
  {
    path: '/client/login',
    element: <LoginPage />,
  },
  {
    path: '/client',
    element: <ClientLayout />,
    children: [
      {
        path: 'main',
        element: <MainPage />,
      },
    ],
  },
];
