import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { MainPage } from '@/apps/client/pages/main/MainPage';
import { ClientPlaceholderPage } from '@/apps/client/pages/placeholder/ClientPlaceholderPage';
import { StoreInfoPage } from '@/apps/client/pages/store-info/StoreInfoPage';
import { ClientUserPage } from '@/apps/client/pages/client-user/ClientUserPage';
import { MenuManagementPage } from '@/apps/client/pages/menu-management/MenuManagementPage';
import { MenuOptionManagementPage } from '@/apps/client/pages/menu-option/MenuOptionManagementPage';
import { StoreTableManagementPage } from '@/apps/client/pages/store-table/StoreTableManagementPage';
import { QrCodeManagementPage } from '@/apps/client/pages/qr-code/QrCodeManagementPage';
import { TableLayoutPage } from '@/apps/client/pages/table-layout/TableLayoutPage';
import { OrderHistoryListPage } from '@/apps/client/pages/order-history/OrderHistoryListPage';
import { PaymentStatusListPage } from '@/apps/client/pages/payment-status/PaymentStatusListPage';
import { SettlementListPage } from '@/apps/client/pages/settlement/SettlementListPage';

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
        path: 'order/history/list',
        element: <OrderHistoryListPage />,
      },
      {
        path: 'order/status/management',
        element: (
          <ClientPlaceholderPage
            title="주문 상태 관리"
            description="접수, 조리중, 서빙완료, 취소 상태를 관리하는 화면입니다."
          />
        ),
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
        element: (
          <ClientPlaceholderPage
            title="공지사항 조회"
            description="점주용 공지사항을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'board/inquiry/management',
        element: (
          <ClientPlaceholderPage
            title="문의사항 관리"
            description="문의사항을 조회하고 관리하는 화면입니다."
          />
        ),
      },
    ],
  },
];
