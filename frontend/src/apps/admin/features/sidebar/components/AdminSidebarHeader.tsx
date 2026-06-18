import { SidebarHeader } from '@/shared/components/sidebar';
import { AdminBrand } from '@/apps/admin/features/brand/components/AdminBrand';
import { useAdminLayoutStore } from '@/apps/admin/stores/adminLayoutStore';

export function AdminSidebarHeader() {
  const closeSidebar = useAdminLayoutStore((state) => state.closeSidebar);
  return <SidebarHeader brand={<AdminBrand />} onClose={closeSidebar} />;
}
