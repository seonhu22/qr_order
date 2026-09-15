import { PageNavigation } from '@/shared/components/navigation';
import { useAdminNavigationMenus } from '@/apps/admin/hooks/useAdminNavigationMenus';

type AdminMainNavigationProps = {
  depth1: string;
  depth2: string;
  current: string;
};

export function AdminMainNavigation({ depth1, depth2, current }: AdminMainNavigationProps) {
  const { breadcrumb, currentNavigation, currentMenu } = useAdminNavigationMenus();

  const resolvedDepth1 = breadcrumb?.depth1 || currentNavigation?.depth1Label || depth1;
  const resolvedDepth2 = breadcrumb?.depth2 || currentNavigation?.depth2Label || depth2;
  const resolvedCurrent =
    breadcrumb?.current || currentMenu?.menuNm || currentNavigation?.itemLabel || current;

  return <PageNavigation depth1={resolvedDepth1} depth2={resolvedDepth2} current={resolvedCurrent} />;
}
