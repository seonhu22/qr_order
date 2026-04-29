import '@/apps/admin/features/common/styles/AdminMainNavigation.css';
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

  return (
    <nav className="admin-main-navigation" aria-label="현재 위치">
      <span className="admin-main-navigation__item">{resolvedDepth1}</span>
      <span className="admin-main-navigation__separator">/</span>
      <span className="admin-main-navigation__item">{resolvedDepth2}</span>
      <span className="admin-main-navigation__separator">/</span>
      <strong className="admin-main-navigation__current">{resolvedCurrent}</strong>
    </nav>
  );
}
