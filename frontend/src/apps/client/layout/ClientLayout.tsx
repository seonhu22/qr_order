import { Outlet } from 'react-router-dom';
import '@/apps/client/layout/ClientLayout.css';

export function ClientLayout() {
  return (
    <div className="client-layout">
      <main className="client-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
