// src/apps/admin/routes/AdminRoutes.tsx

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
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/apps/admin/layout/AdminLayout';
import { NotFoundPage } from '@/shared/pages/error';
import { lazyNamed } from '@/shared/routes/lazyNamed';
import { RejectUnexpectedSearchParams } from '@/apps/admin/routes/RejectUnexpectedSearchParams';

const MainPage = lazyNamed(() => import('@/apps/admin/pages/main/MainPage'), 'MainPage');
const CommonCodePage = lazyNamed(() => import('@/apps/admin/pages/common-code/CommonCodePage'), 'CommonCodePage');
const PaymentManagePage = lazyNamed(() => import('@/apps/admin/pages/payment-manage/PaymentManagePage'), 'PaymentManagePage');
const PlantStatusPage = lazyNamed(() => import('@/apps/admin/pages/plant-status/PlantStatusPage'), 'PlantStatusPage');
const PlantSearchPage = lazyNamed(() => import('@/apps/admin/pages/plant-search/PlantSearchPage'), 'PlantSearchPage');
const AdminUserPage = lazyNamed(() => import('@/apps/admin/pages/admin-user/AdminUserPage'), 'AdminUserPage');
const SystemMenuPage = lazyNamed(() => import('@/apps/admin/pages/system-menu/SystemMenuPage'), 'SystemMenuPage');
const MessageManagementPage = lazyNamed(() => import('@/apps/admin/pages/message-management/MessageManagementPage'), 'MessageManagementPage');
const RuleManagementPage = lazyNamed(() => import('@/apps/admin/pages/rule-management/RuleManagementPage'), 'RuleManagementPage');
const CouponManagePage = lazyNamed(() => import('@/apps/admin/pages/coupon-manage/CouponManagePage'), 'CouponManagePage');
const AccessLogPage = lazyNamed(() => import('@/apps/admin/pages/access-log/AccessLogPage'), 'AccessLogPage');
const ChangeHistoryPage = lazyNamed(() => import('@/apps/admin/pages/change-history/ChangeHistoryPage'), 'ChangeHistoryPage');
const NoticeManagePage = lazyNamed(() => import('@/apps/admin/pages/notice-manage/NoticeManagePage'), 'NoticeManagePage');
const InquiryManagePage = lazyNamed(() => import('@/apps/admin/pages/inquiry-manage/InquiryManagePage'), 'InquiryManagePage');

export const adminRoutes: RouteObject[] = [
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
        element: (
          <RejectUnexpectedSearchParams>
            <RuleManagementPage/>
          </RejectUnexpectedSearchParams>
        ),
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
        element: <AccessLogPage />,
      },
      {
        path: 'history/audit-log',
        element: <ChangeHistoryPage />,
      },
      {
        path: 'notice/manage',
        element: <NoticeManagePage />,
      },
      {
        path: 'inquiry/manage',
        element: <InquiryManagePage />,
      },
      {
        path: '*',
        element: <NotFoundPage homePath="/admin/main" />,
      },
    ],
  },
];
