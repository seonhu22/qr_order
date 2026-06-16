import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { MainPage } from '@/apps/client/pages/main/MainPage';
import { ClientPlaceholderPage } from '@/apps/client/pages/placeholder/ClientPlaceholderPage';
import { StoreInfoPage } from '@/apps/client/pages/store-info/StoreInfoPage';
import { ClientUserPage } from '@/apps/client/pages/client-user/ClientUserPage';
import { StoreTableManagementPage } from '@/apps/client/pages/store-table/StoreTableManagementPage';

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
        element: (
          <ClientPlaceholderPage
            title="QR 코드 관리"
            description="테이블별 QR 정보를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'store/table/layout',
        element: (
          <ClientPlaceholderPage
            title="테이블 배치 관리"
            description="매장 테이블 배치를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'menu/info/management',
        element: (
          <ClientPlaceholderPage
            title="메뉴 관리"
            description="판매 메뉴와 카테고리를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'menu/info/option',
        element: (
          <ClientPlaceholderPage
            title="옵션 관리"
            description="메뉴 옵션 정보를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'order/history/list',
        element: (
          <ClientPlaceholderPage
            title="주문 이력 조회"
            description="완료된 주문 이력을 조회하는 화면입니다."
          />
        ),
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
        element: (
          <ClientPlaceholderPage
            title="결제 목록 조회"
            description="주문 결제 내역을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'payment/calculation/list',
        element: (
          <ClientPlaceholderPage
            title="정산 조회"
            description="매장 정산 정보를 조회하는 화면입니다."
          />
        ),
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
