import { Outlet } from 'react-router-dom';
import Header from '@/shared/components/layout/Header';
import Sidebar from '@/shared/components/layout/Sidebar';
import '@/shared/styles/dashboard.css';

function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-body">
        <Sidebar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
