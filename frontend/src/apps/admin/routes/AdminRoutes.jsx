// src/apps/admin/routes/AdminRoutes.jsx

/**
 * 관리자 페이지 라우트 정의
 *
 * @description
 * - `/admin/login`을 제외한 `/admin/*` 경로는 모두 보호 대상이다.
 * - `AdminLayout`은 Header + Sidebar + Container 기본 레이아웃을 제공한다.
 * - `/admin` 진입 시 `/admin/main`으로 리다이렉트한다.
 *
 * @param {never} _unused 이 파일은 라우트 설정만 내보내는 배럴 성격의 파일이다.
 * @example
 * import { adminRoutes } from '@/apps/admin/routes/AdminRoutes';
 */

import { Navigate } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { MainPage } from '../pages/MainPage';

export const adminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/main" replace />,
      },
      {
        path: 'main',
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
