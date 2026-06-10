import { Navigate } from 'react-router-dom';
import { ClientLayout } from '@/apps/client/layout/ClientLayout';
import LoginPage from '@/apps/client/pages/login/LoginPage';
import { MainPage } from '@/apps/client/pages/main/MainPage';
import { ClientPlaceholderPage } from '@/apps/client/pages/placeholder/ClientPlaceholderPage';

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
        index: true,
        element: <Navigate to="/client/main" replace />,
      },
      {
        path: 'main',
        element: <MainPage />,
      },
      {
        path: 'store/info',
        element: (
          <ClientPlaceholderPage
            title="매장 기본 정보"
            description="매장의 기본 정보를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'store/tables',
        element: (
          <ClientPlaceholderPage
            title="테이블 관리"
            description="매장 테이블 정보를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'store/qr',
        element: (
          <ClientPlaceholderPage
            title="QR 관리"
            description="테이블별 QR 정보를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'store/users',
        element: (
          <ClientPlaceholderPage
            title="유저 정보 관리"
            description="유저를 생성하고 권한을 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'menu/categories',
        element: (
          <ClientPlaceholderPage
            title="메뉴 관리"
            description="판매 메뉴와 카테고리를 관리하는 화면입니다."
          />
        ),
      },
      {
        path: 'menu/options',
        element: (
          <ClientPlaceholderPage
            title="옵션 관리"
            description="메뉴 옵션 정보를 관리하는 화면입니다."
          />
        ),
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
        element: (
          <ClientPlaceholderPage
            title="주문 이력 조회"
            description="완료된 주문 이력을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'payment/list',
        element: (
          <ClientPlaceholderPage
            title="결제 목록 조회"
            description="주문 결제 내역을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'settlement',
        element: (
          <ClientPlaceholderPage
            title="정산 조회"
            description="매장 정산 정보를 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'board/notice',
        element: (
          <ClientPlaceholderPage
            title="공지사항 조회"
            description="점주용 공지사항을 조회하는 화면입니다."
          />
        ),
      },
      {
        path: 'board/qna',
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
