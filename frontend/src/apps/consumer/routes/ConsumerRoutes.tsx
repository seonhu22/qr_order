import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ConsumerLayout } from '@/apps/consumer/layout/ConsumerLayout';
import { QrEntryPage } from '@/apps/consumer/pages/qr-entry/QrEntryPage';
import { ConsumerOrderPage } from '@/apps/consumer/pages/order/ConsumerOrderPage';
import { NotFoundPage } from '@/shared/pages/error';
import { ConsumerSessionGuard } from './ConsumerSessionGuard';

/**
 * `/qr/:url` standalone 진입과 `/consumer/*`(QR 세션 가드 + 모바일 셸)를 소유한다.
 * shared/routes/AppRoutes.tsx는 이 배열을 조합만 하고 Consumer 개별 page를 직접 import하지 않는다.
 */
export const consumerRoutes: RouteObject[] = [
  {
    path: '/qr/:url',
    element: <QrEntryPage />,
  },
  {
    path: '/consumer',
    element: (
      <ConsumerSessionGuard>
        <ConsumerLayout />
      </ConsumerSessionGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/consumer/order" replace /> },
      { path: 'order', element: <ConsumerOrderPage /> },
      {
        path: '*',
        element: (
          <NotFoundPage
            homePath="/consumer/order"
            homeLabel="주문 화면으로 이동"
            layout="contained"
          />
        ),
      },
    ],
  },
];
