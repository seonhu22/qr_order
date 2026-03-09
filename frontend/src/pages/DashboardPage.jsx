import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import '../styles/dashboard.css';

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
