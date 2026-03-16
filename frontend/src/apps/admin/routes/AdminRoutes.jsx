import DashboardPage from '@/apps/admin/pages/DashboardPage';
import PlantPage from '@/apps/admin/pages/system/PlantPage';

const dashboardIndexElement = (
  <div className="welcome-content">
    <p>좌측 메뉴에서 항목을 선택해주세요.</p>
  </div>
);

export const adminRoutes = [
  {
    path: '/dashboard',
    element: <DashboardPage />,
    children: [
      {
        index: true,
        element: dashboardIndexElement,
      },
      {
        path: 'system/settings/plant',
        element: <PlantPage />,
      },
    ],
  },
];
