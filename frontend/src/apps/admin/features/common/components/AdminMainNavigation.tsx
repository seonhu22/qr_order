import '@/apps/admin/features/common/styles/AdminMainNavigation.css';
import { useCurrentAdminMenu } from '@/shared/menu/useAdminMenuCatalogQuery';

type AdminMainNavigationProps = {
  depth1: string;
  depth2: string;
  current: string;
};

export function AdminMainNavigation({ depth1, depth2, current }: AdminMainNavigationProps) {
  const { currentMenu } = useCurrentAdminMenu();
  const resolvedCurrent = currentMenu?.menuNm || current;

  return (
    <nav className="admin-main-navigation" aria-label="현재 위치">
      <span className="admin-main-navigation__item">{depth1}</span>
      <span className="admin-main-navigation__separator">/</span>
      <span className="admin-main-navigation__item">{depth2}</span>
      <span className="admin-main-navigation__separator">/</span>
      <strong className="admin-main-navigation__current">{resolvedCurrent}</strong>
    </nav>
  );
}
