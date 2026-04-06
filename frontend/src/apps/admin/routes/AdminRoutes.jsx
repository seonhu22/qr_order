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
import { AdminLayout } from '@/apps/admin/layout/AdminLayout';
import { MainPage } from '@/apps/admin/pages/MainPage';
import AdminPlaceholderPage from '@/apps/admin/features/common/components/AdminPlaceholderPage';
import { CommonCodePage } from '@/apps/admin/pages/CommonCodePage';
import { PlantSearchPage } from '@/apps/admin/pages/PlantSearchPage';

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
        path: 'system/common-code',
        element: <CommonCodePage />,
      },
      {
        path: 'system/plant',
        element: <PlantSearchPage />,
      },
      {
        path: 'system/admin-user',
        element: <AdminPlaceholderPage title="관리자 관리" />,
      },
      {
        path: 'system/menu',
        element: <AdminPlaceholderPage title="메뉴 관리" />,
      },
      {
        path: 'system/message',
        element: <AdminPlaceholderPage title="메시지 관리" />,
      },
      {
        path: 'system/rule',
        element: <AdminPlaceholderPage title="규칙 관리" />,
      },
      {
        path: 'payment/rate',
        element: <AdminPlaceholderPage title="결제 요금 관리" />,
      },
      {
        path: 'payment/plant-status',
        element: <AdminPlaceholderPage title="사업장 상태 조회" />,
      },
      {
        path: 'payment/coupon',
        element: <AdminPlaceholderPage title="쿠폰 관리" />,
      },
      {
        path: 'history/access-log',
        element: <AdminPlaceholderPage title="접속 정보 조회" />,
      },
      {
        path: 'history/audit-log',
        element: <AdminPlaceholderPage title="변경 이력 조회" />,
      },
    ],
  },
];
