import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { lazyNamed } from '@/shared/routes/lazyNamed';

const MainPage = lazyNamed(() => import('@/apps/client/pages/main/MainPage'), 'MainPage');
const StoreInfoPage = lazyNamed(() => import('@/apps/client/pages/store-info/StoreInfoPage'), 'StoreInfoPage');
const ClientUserPage = lazyNamed(() => import('@/apps/client/pages/client-user/ClientUserPage'), 'ClientUserPage');
const MenuManagementPage = lazyNamed(() => import('@/apps/client/pages/menu-management/MenuManagementPage'), 'MenuManagementPage');
const MenuOptionManagementPage = lazyNamed(() => import('@/apps/client/pages/menu-option/MenuOptionManagementPage'), 'MenuOptionManagementPage');
const StaffCallManagementPage = lazyNamed(() => import('@/apps/client/pages/staff-call-management/StaffCallManagementPage'), 'StaffCallManagementPage');
const StoreTableManagementPage = lazyNamed(() => import('@/apps/client/pages/store-table/StoreTableManagementPage'), 'StoreTableManagementPage');
const QrCodeManagementPage = lazyNamed(() => import('@/apps/client/pages/qr-code/QrCodeManagementPage'), 'QrCodeManagementPage');
const TableLayoutPage = lazyNamed(() => import('@/apps/client/pages/table-layout/TableLayoutPage'), 'TableLayoutPage');
const OrderHistoryListPage = lazyNamed(() => import('@/apps/client/pages/order-history/OrderHistoryListPage'), 'OrderHistoryListPage');
const OrderStatusManagementPage = lazyNamed(() => import('@/apps/client/pages/order-status-management/OrderStatusManagementPage'), 'OrderStatusManagementPage');
const PaymentStatusListPage = lazyNamed(() => import('@/apps/client/pages/payment-status/PaymentStatusListPage'), 'PaymentStatusListPage');
const SettlementListPage = lazyNamed(() => import('@/apps/client/pages/settlement/SettlementListPage'), 'SettlementListPage');
const NoticeListPage = lazyNamed(() => import('@/apps/client/pages/notice/NoticeListPage'), 'NoticeListPage');
const InquiryManagementPage = lazyNamed(() => import('@/apps/client/pages/inquiry/InquiryManagementPage'), 'InquiryManagementPage');

export const clientRoutes: RouteObject[] = [
  {
    path: '/client/login',
    element: <LoginPage />,
  },
  {
    path: '/client',
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/client/main" replace />,
      },
      {
        path: 'main',
        element: <MainPage />,
      },
      {
        path: 'store/user/management',
        element: <ClientUserPage />,
      },
      {
        path: 'store/info/base',
        element: <StoreInfoPage />,
      },
      {
        path: 'store/table/management',
        element: <StoreTableManagementPage />,
      },
      {
        path: 'store/table/qr',
        element: <QrCodeManagementPage />,
      },
      {
        path: 'store/table/layout',
        element: <TableLayoutPage />,
      },
      {
        path: 'menu/info/management',
        element: <MenuManagementPage />,
      },
      {
        path: 'menu/info/option',
        element: <MenuOptionManagementPage />,
      },
      {
        path: 'menu/info/staff-call',
        element: <StaffCallManagementPage />,
      },
      {
        path: 'order/history/list',
        element: <OrderHistoryListPage />,
      },
      {
        path: 'order/status/management',
        element: <OrderStatusManagementPage />,
      },
      {
        path: 'payment/status/list',
        element: <PaymentStatusListPage />,
      },
      {
        path: 'payment/calculation/list',
        element: <SettlementListPage />,
      },
      {
        path: 'board/notice/list',
        element: <NoticeListPage />,
      },
      {
        path: 'board/inquiry/management',
        element: <InquiryManagementPage />,
      },
    ],
  },
];
