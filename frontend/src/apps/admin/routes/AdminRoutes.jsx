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
import { MainPage } from '@/apps/admin/pages/main/MainPage';
import AdminPlaceholderPage from '@/apps/admin/features/common/components/AdminPlaceholderPage';
import { CommonCodePage } from '@/apps/admin/pages/common-code/CommonCodePage';
import { PaymentManagePage } from '@/apps/admin/pages/payment-manage/PaymentManagePage';
import { PlantStatusPage } from '@/apps/admin/pages/plant-status/PlantStatusPage';
import { PlantSearchPage } from '@/apps/admin/pages/plant-search/PlantSearchPage';
import { AdminUserPage } from '@/apps/admin/pages/admin-user/AdminUserPage';
import { SystemMenuPage } from '@/apps/admin/pages/system-menu/SystemMenuPage';
import { MessageManagementPage } from '@/apps/admin/pages/message-management/MessageManagementPage';
import { RuleManagementPage } from '@/apps/admin/pages/rule-management/RuleManagementPage';
import { CouponManagePage } from '@/apps/admin/pages/coupon-manage/CouponManagePage';

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
        element: <MainPage/>,
      },
      {
        path: 'system/common-code',
        element: <CommonCodePage/>,
      },
      {
        path: 'system/plant',
        element: <PlantSearchPage/>,
      },
      {
        path: 'system/admin-user',
        element: <AdminUserPage/>,
      },
      {
        path: 'system/menu',
        element: <SystemMenuPage />,
      },
      {
        path: 'system/message',
        element: <MessageManagementPage/>,
      },
      {
        path: 'system/rule',
        element: <RuleManagementPage/>,
      },
      {
        path: 'payment/rate',
        element: <PaymentManagePage />,
      },
      {
        path: 'payment/plant-status',
        element: <PlantStatusPage />,
      },
      {
        path: 'payment/coupon',
        element: <CouponManagePage />,
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