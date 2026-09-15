import { SidebarHeader } from '@/shared/components/sidebar';
import { ClientBrand } from '@/apps/client/features/brand/components/ClientBrand';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';

export function ClientSidebarHeader() {
  const closeSidebar = useClientLayoutStore((s) => s.closeSidebar);
  return <SidebarHeader brand={<ClientBrand />} onClose={closeSidebar} />;
}
