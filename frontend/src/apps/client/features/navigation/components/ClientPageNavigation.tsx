import { PageNavigation } from '@/shared/components/navigation';
import type { ClientMenuBreadcrumb } from '@/shared/menu/clientNavigation';

type ClientPageNavigationProps = {
  breadcrumb: ClientMenuBreadcrumb | null;
};

export function ClientPageNavigation({ breadcrumb }: ClientPageNavigationProps) {
  if (!breadcrumb) {
    return null;
  }

  return (
    <PageNavigation depth1={breadcrumb.depth1} depth2={breadcrumb.depth2} current={breadcrumb.depth3} />
  );
}
