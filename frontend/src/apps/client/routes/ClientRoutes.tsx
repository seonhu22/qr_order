import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { MainPage } from '@/apps/client/pages/main/MainPage';
import { ClientPlaceholderPage } from '@/apps/client/pages/placeholder/ClientPlaceholderPage';
import { StoreInfoPage } from '@/apps/client/pages/store/info/StoreInfoPage';
import { ClientUserPage } from '@/apps/client/pages/store/ClientUserPage';
import { StoreTableInfoPage } from '@/apps/client/pages/store/tables/StoreTableInfoPage';
import { QRCodeManagePage } from '@/apps/client/pages/store/qr/QRCodeManagePage';
import { MenuManagePage } from '@/apps/client/pages/menu/MenuManagePage';
import { OptionManagePage } from '@/apps/client/pages/menu/OptionManagePage';
import { OrderHistoryPage } from '@/apps/client/pages/order/OrderHistoryPage';
import { PaymentListPage } from '@/apps/client/pages/payment/PaymentListPage';
import { SettlementPage } from '@/apps/client/pages/payment/SettlementPage';
import { NoticeListPage } from '@/apps/client/pages/board/NoticeListPage';
import { QnaManagePage } from '@/apps/client/pages/board/QnaManagePage';

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
        path: 'store/info',
        element: <StoreInfoPage />,
      },
      {
        path: 'store/tables',
        element: <StoreTableInfoPage />,
      },
      {
        path: 'store/qr',
        element: <QRCodeManagePage />,
      },
      {
        path: 'store/users',
        element: <ClientUserPage />,
      },
      {
        path: 'menu/categories',
        element: <MenuManagePage />,
      },
      {
        path: 'menu/options',
        element: <OptionManagePage />,
      },
      {
        path: 'order/current',
        element: (
          <ClientPlaceholderPage
            title="실시간 주문 조회"
            description="접수된 주문 실시간 목록을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'order/status',
        element: (
          <ClientPlaceholderPage
            title="주문 상태 관리"
            description="접수, 조리중, 서빙완료, 취소 상태를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'order/history',
        element: <OrderHistoryPage />,
      },
      {
        path: 'payment/list',
        element: <PaymentListPage />,
      },
      {
        path: 'settlement',
        element: <SettlementPage />,
      },
      {
        path: 'board/notice',
        element: <NoticeListPage />,
      },
      {
        path: 'board/qna',
        element: <QnaManagePage />,
      },
    ],
  },
];
